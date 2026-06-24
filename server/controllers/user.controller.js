const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const nodemailer = require("nodemailer");

const {
  uploadProfileImageToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const path = require("path");

const SAFE_USER_SELECT = "-password -emailVerificationOTP -emailVerificationOTPExpires -profilePicturePublicId";
const PROFILE_FIELDS = ["username", "phone", "location", "website", "bio"];

const getJwtCookieMaxAge = () => {
  const explicitMaxAge = Number(process.env.JWT_COOKIE_MAX_AGE_MS);
  if (Number.isFinite(explicitMaxAge) && explicitMaxAge > 0) return explicitMaxAge;

  const expiry = String(process.env.JWT_EXPIRE || "7d").trim();
  const match = expiry.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const getMailAuth = () => ({
  user: process.env.EMAIL_USER || process.env.SMTP_USER,
  pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
});

const createMailTransporter = () => {
  const auth = getMailAuth();

  if (!auth.user || !auth.pass) {
    throw new Error("Email service is not configured");
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth,
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth,
  });
};

const getMailFrom = (name = "Job Placements") => {
  const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
  return `"${name}" <${fromEmail}>`;
};

const emptyProfileImage = () => ({
  url: "",
  publicId: "",
  fileName: "",
  originalName: "",
  mimeType: "",
  size: 0,
});

const sanitizeOriginalName = (name = "profile") => {
  const parsed = path.parse(path.basename(name));
  const safeBase =
    parsed.name
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90) || "profile";
  const safeExt = parsed.ext.toLowerCase().replace(/[^\w.]/g, "");

  return `${safeBase}${safeExt}`;
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;

  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.error("Error deleting Cloudinary profile image:", error);
  }
};

const snapshotStoredProfileImage = (user) => ({
  publicId: user?.profileImage?.publicId || user?.profilePicturePublicId || "",
});

const removeStoredProfileImage = async (user) => {
  await deleteCloudinaryImage(
    user?.publicId || user?.profileImage?.publicId || user?.profilePicturePublicId
  );
};

const getProfileImageRecord = (file, cloudinaryResult) => ({
  url: cloudinaryResult.secure_url,
  publicId: cloudinaryResult.public_id,
  fileName: `${cloudinaryResult.public_id}.${cloudinaryResult.format || "image"}`,
  originalName: sanitizeOriginalName(file.originalname),
  mimeType: file.mimetype,
  size: file.size,
});

const uploadProfileImageForUser = async (file, user) => {
  if (!file?.buffer) {
    throw new Error("Profile image upload failed. Please choose the image again.");
  }

  const uploadResult = await uploadProfileImageToCloudinary(file.buffer, {
    userId: user._id,
    originalName: file.originalname,
  });

  return getProfileImageRecord(file, uploadResult);
};

const getPublicUser = async (userId) =>
  User.findById(userId).select(SAFE_USER_SELECT);

const applyOwnProfileFields = (user, body = {}) => {
  PROFILE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      user[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  if (user.role === "candidate" && body.jobProfession !== undefined) {
    user.jobProfession = body.jobProfession.trim();
  }
};

const checkPhoneAvailability = async (user, phone) => {
  if (!phone || phone === user.phone) return null;

  return User.findOne({
    _id: { $ne: user._id },
    phone,
  }).select("_id");
};

const sendUpdatedUser = async (res, user, message) => {
  const publicUser = await getPublicUser(user._id);
  const userJson = publicUser.toJSON();

  return res.status(200).json({
    success: true,
    message,
    user: userJson,
    data: {
      user: userJson,
    },
  });
};

const userController = {

  createUser: async (req, res) => {
    try {
      const { username, email, password, role, phone, jobProfession } = req.body;

      // Validate required fields
      const requiredFields = { username, email, password, role, phone };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }

      // Validate role
      if (!["candidate", "recruiter"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Public registration supports candidate or recruiter accounts only",
        });
      }

      // Validate jobProfession for candidates
      if (role === "candidate" && !jobProfession) {
        return res.status(400).json({
          success: false,
          message: "Job profession is required for candidates",
        });
      }

      // Validate phone number format (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number",
        });
      }

      // Check existing user
      const existUser = await User.findOne({
        $or: [{ email }, { phone }]
      }).select("+email +phone");

      if (existUser) {
        const field = existUser.email === email ? "email" : "phone";
        return res.status(409).json({
          success: false,
          message: `User with this ${field} already exists.`,
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Create user data object
      const userData = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        phone: phone.trim(),
        isEmailVerified: false,
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: Date.now() + 5 * 60 * 1000, // 5 min
      };

      // Add jobProfession only for candidates
      if (role === "candidate") {
        userData.jobProfession = jobProfession.trim();
      }

      // Create user
      const newUser = await User.create(userData);

      // Send email (OTP)
      const transporter = createMailTransporter();

      await transporter.sendMail({
        from: getMailFrom("Job Placements"),
        to: email,
        subject: "Email Verification OTP",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Job Placements!</h2>
          <h3>Hello ${username},</h3>
          <p>Thank you for registering. Please verify your email address using the OTP below:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">&copy; 2024 Job Placements. All rights reserved.</p>
        </div>
      `,
      });

      // Prepare response (exclude sensitive data)
      const userResponse = {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        isEmailVerified: newUser.isEmailVerified,
        avatarUrl: newUser.avatarUrl,
        ...(newUser.jobProfession && { jobProfession: newUser.jobProfession }),
      };

      return res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        data: userResponse,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Find user and explicitly select password field
      const user = await User.findOne({ email: email.toLowerCase().trim() })
        .select("+password +emailVerificationOTP +emailVerificationOTPExpires");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({
          success: false,
          message: "Please verify your email before logging in",
          isEmailVerified: false,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = generateToken(user);
      const isProduction = process.env.NODE_ENV === "production";

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: getJwtCookieMaxAge(),
      });

      // Prepare user response
      const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        profileImage: user.profileImage,
        avatarUrl: user.avatarUrl,
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        ...(user.jobProfession && { jobProfession: user.jobProfession }),
      };

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: userResponse,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  logoutUser: (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },

  getUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password -emailVerificationOTP -emailVerificationOTPExpires -profilePicturePublicId");

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No users found",
        });
      }

      // Include avatar URLs
      const usersWithAvatars = users.map((user) => user.toJSON());

      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        count: users.length,
        data: usersWithAvatars,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Get logged in user details
  getLoggedInUser: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId)
        .select(SAFE_USER_SELECT);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userJson = user.toJSON();

      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user: userJson,
        data: {
          user: userJson,
        },
      });
    } catch (error) {
      console.error("Error fetching logged in user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  updateOwnProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("+profilePicturePublicId");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      applyOwnProfileFields(user, req.body);

      const duplicatePhone = await checkPhoneAvailability(user, user.phone);
      if (duplicatePhone) {
        return res.status(409).json({
          success: false,
          message: "User with this phone already exists",
        });
      }

      await user.validate();

      let previousProfileImage = null;
      let newProfileImage = null;

      if (req.file) {
        previousProfileImage = snapshotStoredProfileImage(user);
        newProfileImage = await uploadProfileImageForUser(req.file, user);
        user.profileImage = newProfileImage;
        user.profilePicture = newProfileImage.url;
        user.profilePicturePublicId = newProfileImage.publicId;
      }

      try {
        await user.save();
      } catch (error) {
        if (newProfileImage?.publicId) {
          await deleteCloudinaryImage(newProfileImage.publicId);
        }
        throw error;
      }

      if (previousProfileImage) await removeStoredProfileImage(previousProfileImage);
      return sendUpdatedUser(res, user, "Profile updated successfully");
    } catch (error) {
      console.error("Error updating own profile:", error);

      return res.status(error.name === "ValidationError" ? 400 : 500).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  },

  uploadOwnProfileImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile image is required",
        });
      }

      const user = await User.findById(req.user._id).select("+profilePicturePublicId");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const previousProfileImage = snapshotStoredProfileImage(user);
      const newProfileImage = await uploadProfileImageForUser(req.file, user);
      user.profileImage = newProfileImage;
      user.profilePicture = newProfileImage.url;
      user.profilePicturePublicId = newProfileImage.publicId;

      try {
        await user.save();
      } catch (error) {
        await deleteCloudinaryImage(newProfileImage.publicId);
        throw error;
      }

      await removeStoredProfileImage(previousProfileImage);

      return sendUpdatedUser(res, user, "Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading profile image:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload profile image",
        error: error.message,
      });
    }
  },

  deleteOwnProfileImage: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("+profilePicturePublicId");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.profileImage?.url && !user.profilePicture && !user.profilePicturePublicId) {
        return res.status(400).json({
          success: false,
          message: "No profile image to remove",
        });
      }

      const previousProfileImage = snapshotStoredProfileImage(user);
      user.profileImage = emptyProfileImage();
      user.profilePicture = null;
      user.profilePicturePublicId = null;
      await user.save();
      await removeStoredProfileImage(previousProfileImage);

      return sendUpdatedUser(res, user, "Profile image removed successfully");
    } catch (error) {
      console.error("Error deleting profile image:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to remove profile image",
        error: error.message,
      });
    }
  },

  // Update user by ID
  updateUsersById: async (req, res) => {
    try {
      const id = req.params.id;
      const updatedData = req.body;

      if (req.user.role !== "admin" && req.user._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own profile",
        });
      }

      // Prevent updating sensitive fields
      delete updatedData.password;
      delete updatedData.profilePicture;
      delete updatedData.profileImage;
      delete updatedData.profilePicturePublicId;
      delete updatedData.emailVerificationOTP;
      delete updatedData.emailVerificationOTPExpires;
      delete updatedData.isEmailVerified;
      delete updatedData.role; // Prevent role changes through this endpoint

      // Trim string fields
      if (updatedData.username) updatedData.username = updatedData.username.trim();
      if (updatedData.email) updatedData.email = updatedData.email.toLowerCase().trim();
      if (updatedData.phone) updatedData.phone = updatedData.phone.trim();
      if (updatedData.jobProfession) updatedData.jobProfession = updatedData.jobProfession.trim();
      if (updatedData.location) updatedData.location = updatedData.location.trim();
      if (updatedData.website) updatedData.website = updatedData.website.trim();

      // Validate phone if provided
      if (updatedData.phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(updatedData.phone)) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid 10-digit phone number",
          });
        }
      }

      // Validate email if provided
      if (updatedData.email) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updatedData.email)) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid email address",
          });
        }
      }

      // Check if email or phone already exists for other users
      if (updatedData.email || updatedData.phone) {
        const existingUser = await User.findOne({
          $and: [
            { _id: { $ne: id } },
            {
              $or: [
                ...(updatedData.email ? [{ email: updatedData.email }] : []),
                ...(updatedData.phone ? [{ phone: updatedData.phone }] : []),
              ],
            },
          ],
        });

        if (existingUser) {
          const field = existingUser.email === updatedData.email ? "email" : "phone";
          return res.status(409).json({
            success: false,
            message: `User with this ${field} already exists`,
          });
        }
      }

      const updateUser = await User.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      }).select(SAFE_USER_SELECT);

      if (!updateUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updateUser.toJSON(),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Delete user by ID
  deleteUsersById: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "User ID required",
        });
      }

      const user = await User.findById(id).select("+profilePicturePublicId");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await removeStoredProfileImage(user);

      const deletedUser = await User.findByIdAndDelete(id)
        .select(SAFE_USER_SELECT);

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: deletedUser,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // ============================================
  // PROFILE PICTURE MANAGEMENT
  // ============================================

  /**
   * Upload profile picture (Cloudinary)
   * POST /api/v1/user/profile-picture
   */
  uploadProfilePicture: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const userId = req.user._id;
      const user = await User.findById(userId).select("+profilePicturePublicId");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const previousProfileImage = snapshotStoredProfileImage(user);
      const newProfileImage = await uploadProfileImageForUser(req.file, user);
      user.profileImage = newProfileImage;
      user.profilePicture = newProfileImage.url;
      user.profilePicturePublicId = newProfileImage.publicId;

      try {
        await user.save();
      } catch (error) {
        await deleteCloudinaryImage(newProfileImage.publicId);
        throw error;
      }

      await removeStoredProfileImage(previousProfileImage);

      return sendUpdatedUser(res, user, "Profile picture uploaded successfully");
    } catch (error) {
      console.error("Error uploading profile picture:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture",
        error: error.message,
      });
    }
  },

  /**
   * Delete profile picture
   * DELETE /api/v1/user/profile-picture
   */
  deleteProfilePicture: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).select("+profilePicturePublicId");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.profileImage?.url && !user.profilePicture && !user.profilePicturePublicId) {
        return res.status(400).json({
          success: false,
          message: "No profile picture to delete",
        });
      }

      const previousProfileImage = snapshotStoredProfileImage(user);

      user.profileImage = emptyProfileImage();
      user.profilePicture = null;
      user.profilePicturePublicId = null;
      await user.save();
      await removeStoredProfileImage(previousProfileImage);

      return sendUpdatedUser(res, user, "Profile picture deleted successfully");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete profile picture",
        error: error.message,
      });
    }
  },

  /**
   * Get user profile picture
   * GET /api/v1/user/:id/profile-picture
   */
  getProfilePicture: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId).select(
        "username profilePicture profileImage"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          username: user.username,
          profilePicture: user.profilePicture,
          profileImage: user.profileImage,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch profile picture",
        error: error.message,
      });
    }
  },

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  verifyEmail: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() })
        .select("+emailVerificationOTP +emailVerificationOTPExpires");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already verified",
        });
      }

      if (
        !user.emailVerificationOTP ||
        user.emailVerificationOTP !== otp ||
        user.emailVerificationOTPExpires < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationOTP = null;
      user.emailVerificationOTPExpires = null;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already verified",
        });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

      await user.save();

      // Send Email
      const transporter = createMailTransporter();

      await transporter.sendMail({
        from: getMailFrom("Career Vista"),
        to: email,
        subject: "Resend OTP - Email Verification",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Career Vista</h2>
          <h3>Hello ${user.username},</h3>
          <p>Your new OTP for email verification is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        </div>
      `,
      });

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account exists, a reset code has been sent.",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      const transporter = createMailTransporter();

      await transporter.sendMail({
        from: getMailFrom("Job Placements"),
        to: user.email,
        subject: "Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Job Placements</h2>
            <h3>Hello ${user.username},</h3>
            <p>Use the OTP below to reset your password.</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "If an account exists, a reset code has been sent.",
      });
    } catch (error) {
      console.error("Error sending password reset OTP:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, otp, password } = req.body;

      if (!email || !otp || !password) {
        return res.status(400).json({
          success: false,
          message: "Email, OTP, and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() })
        .select("+password +passwordResetOTP +passwordResetOTPExpires");

      if (!user || user.passwordResetOTP !== otp || user.passwordResetOTPExpires < Date.now()) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.passwordResetOTP = null;
      user.passwordResetOTPExpires = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      const user = await User.findById(userId).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
 getRecruiter: async (req, res) => {
  try {
    const recruiters = await User.find({ role: "recruiter", accountStatus: { $ne: "Blocked" } })
      .select("username role profilePicture profileImage avatarUrl recruiterApprovalStatus");

    res.status(200).json({
      success: true,
      data: recruiters,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
};


module.exports = userController;
