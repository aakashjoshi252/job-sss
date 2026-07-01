const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { getClientIp } = require("../utils/requestIp");
const {
  markLatestLogoutActivity,
  recordLoginActivity,
} = require("../services/loginActivity.service");

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

const APP_NAME = process.env.APP_NAME || "JewelCancy";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@jewelcancy.com";
const WEBSITE_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://www.jewelcancy.com").replace(/\/$/, "");

const getEmailFooter = () => `
  <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #374151; font-size: 13px; margin: 0 0 4px;">Need help?</p>
  <p style="color: #2563eb; font-size: 13px; margin: 0;">${SUPPORT_EMAIL}</p>
  <p style="color: #2563eb; font-size: 13px; margin: 4px 0 0;">${WEBSITE_URL.replace(/^https?:\/\//, "")}</p>
  <p style="color: #6b7280; font-size: 12px;">&copy; 2026 ${APP_NAME}. All Rights Reserved.</p>
`;

const getMailFrom = (name = APP_NAME) => {
  const fromEmail = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
  return `"${name}" <${fromEmail || SUPPORT_EMAIL}>`;
};

const isProduction = () => process.env.NODE_ENV === "production";
const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();
const normalizeOtp = (otp = "") => String(otp || "").trim();
const getSubmittedOtp = (body = {}) => normalizeOtp(body.otp ?? body.verificationCode ?? body.code);
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getNumberEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const getVerificationOtpMinutes = () => getNumberEnv("EMAIL_VERIFICATION_OTP_MINUTES", 10);
const getPasswordResetOtpMinutes = () => getNumberEnv("PASSWORD_RESET_OTP_MINUTES", 10);
const getOtpExpiryDate = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const sendMailSafely = async (mailOptions, context = "email") => {
  try {
    const transporter = createMailTransporter();
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    logger.error(`Failed to send ${context}: ${error.message}`, { stack: error.stack });
    return { sent: false, error: error.message };
  }
};

const getEmailDeliveryData = (mailResult, otp) => {
  const data = {
    emailDelivery: {
      sent: Boolean(mailResult?.sent),
    },
  };

  if (!mailResult?.sent) {
    data.emailDelivery.message = isProduction()
      ? "Email delivery failed. Please contact support or try resend OTP."
      : mailResult?.error || "Email delivery failed.";

    if (!isProduction()) {
      data.devOtp = otp;
    }
  }

  return data;
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
    logger.error(`Error deleting Cloudinary profile image: ${error.message}`, { stack: error.stack });
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
      const normalizedUsername = String(username || "").trim();
      const normalizedEmail = normalizeEmail(email);
      const normalizedPhone = String(phone || "").trim();
      const normalizedRole = String(role || "").trim();
      const normalizedJobProfession = String(jobProfession || "").trim();

      const requiredFields = {
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        role: normalizedRole,
        phone: normalizedPhone,
      };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          code: "MISSING_FIELDS",
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      if (!["candidate", "recruiter"].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_ROLE",
          message: "Invalid role. Public registration supports candidate or recruiter accounts only",
        });
      }

      if (normalizedRole === "candidate" && !normalizedJobProfession) {
        return res.status(400).json({
          success: false,
          code: "JOB_PROFESSION_REQUIRED",
          message: "Job profession is required for candidates",
        });
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_PHONE",
          message: "Please provide a valid 10-digit phone number",
        });
      }

      const existUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      }).select("+email +phone");

      if (existUser) {
        const field = existUser.email === normalizedEmail ? "email" : "phone";
        return res.status(409).json({
          success: false,
          code: "USER_ALREADY_EXISTS",
          message: `User with this ${field} already exists.`,
          data: field,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const otp = generateOtp();
      const otpMinutes = getVerificationOtpMinutes();

      const userData = {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        phone: normalizedPhone,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: getOtpExpiryDate(otpMinutes),
      };

      if (normalizedRole === "candidate") {
        userData.jobProfession = normalizedJobProfession;
      }

      const newUser = await User.create(userData);

      const mailResult = await sendMailSafely({
        from: getMailFrom(),
        to: normalizedEmail,
        subject: "Welcome to JewelCancy",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to JewelCancy!</h2>
          <h3>Hello ${normalizedUsername},</h3>
          <p>Thank you for registering. Please verify your email address using the OTP below:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>${otpMinutes} minutes</strong>.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          ${getEmailFooter()}
        </div>
      `,
      }, "registration verification OTP");

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
        message: mailResult.sent
          ? "User registered successfully. Please verify your email."
          : "User registered successfully, but the verification email could not be sent. Please use resend OTP or contact support.",
        data: {
          ...userResponse,
          user: userResponse,
          ...getEmailDeliveryData(mailResult, otp),
        },
      });
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        error: isProduction() ? undefined : error.message,
      });
    }
  },
  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);

      if (!email || !password) {
        await recordLoginActivity({
          req,
          email: normalizedEmail,
          status: "failed",
          reason: "Missing email or password",
        });

        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Find user and explicitly select password field
      const user = await User.findOne({ email: normalizedEmail })
        .select("+password +emailVerificationOTP +emailVerificationOTPExpires");

      if (!user) {
        await recordLoginActivity({
          req,
          email: normalizedEmail,
          status: "failed",
          reason: "Invalid email or password",
        });

        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        await recordLoginActivity({
          req,
          user,
          email: normalizedEmail,
          status: "failed",
          reason: "Email is not verified",
        });

        return res.status(401).json({
          success: false,
          message: "Please verify your email before logging in",
          isEmailVerified: false,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        await recordLoginActivity({
          req,
          user,
          email: normalizedEmail,
          status: "failed",
          reason: "Invalid email or password",
        });

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

      const loginActivity = await recordLoginActivity({
        req,
        user,
        email: normalizedEmail,
        status: "success",
      });
      const lastLoginAt = loginActivity?.loginTime || new Date();
      const lastLoginIp = loginActivity?.ipAddress || getClientIp(req);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            lastLoginAt,
            lastLoginIp,
          },
        }
      );

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
        lastLoginAt,
        ...(user.jobProfession && { jobProfession: user.jobProfession }),
      };

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: userResponse,
        token,
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  logoutUser: async (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const token =
      req.cookies?.token
      || (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await markLatestLogoutActivity(decoded.id);
      } catch (error) {
        logger.warn(`Logout activity could not be recorded: ${error.message}`);
      }
    }

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
      logger.error(`Error fetching users: ${error.message}`, { stack: error.stack });
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
      logger.error(`Error fetching logged in user: ${error.message}`, { stack: error.stack });
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
      logger.error(`Error updating own profile: ${error.message}`, { stack: error.stack });

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
      logger.error(`Error uploading profile image: ${error.message}`, { stack: error.stack });

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
      logger.error(`Error deleting profile image: ${error.message}`, { stack: error.stack });

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
      logger.error(`Error updating user: ${error.message}`, { stack: error.stack });
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
      logger.error(`Error deleting user: ${error.message}`, { stack: error.stack });
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
      logger.error(`Error uploading profile picture: ${error.message}`, { stack: error.stack });

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
      logger.error(`Error deleting profile picture: ${error.message}`, { stack: error.stack });
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
      logger.error(`Error fetching profile picture: ${error.message}`, { stack: error.stack });
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
      const email = normalizeEmail(req.body.email);
      const submittedOtp = getSubmittedOtp(req.body);

      if (!email || !submittedOtp) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_OTP_REQUIRED",
          message: "Email and OTP are required",
        });
      }

      const user = await User.findOne({ email })
        .select("+emailVerificationOTP +emailVerificationOTPExpires");

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.isEmailVerified) {
        return res.status(200).json({
          success: true,
          code: "EMAIL_ALREADY_VERIFIED",
          message: "Email already verified",
          data: {},
        });
      }

      const storedOtp = normalizeOtp(user.emailVerificationOTP);
      const expiresAt = user.emailVerificationOTPExpires
        ? new Date(user.emailVerificationOTPExpires).getTime()
        : 0;

      if (!storedOtp || storedOtp !== submittedOtp) {
        return res.status(400).json({
          success: false,
          code: "INVALID_OTP",
          message: "Invalid verification code",
        });
      }

      if (!expiresAt || expiresAt < Date.now()) {
        return res.status(400).json({
          success: false,
          code: "OTP_EXPIRED",
          message: "Verification code has expired. Please request a new OTP.",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationOTP = null;
      user.emailVerificationOTPExpires = null;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: {},
      });
    } catch (error) {
      logger.error(`Error verifying email: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  resendOTP: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);

      if (!email) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_REQUIRED",
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_ALREADY_VERIFIED",
          message: "Email already verified",
        });
      }

      const otp = generateOtp();
      const otpMinutes = getVerificationOtpMinutes();
      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpires = getOtpExpiryDate(otpMinutes);

      await user.save();

      const mailResult = await sendMailSafely({
        from: getMailFrom(),
        to: email,
        subject: "Welcome to JewelCancy",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">JewelCancy</h2>
          <h3>Hello ${user.username},</h3>
          <p>Your new OTP for email verification is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>${otpMinutes} minutes</strong>.</p>
          ${getEmailFooter()}
        </div>
      `,
      }, "email verification OTP resend");

      return res.status(200).json({
        success: true,
        message: mailResult.sent
          ? "OTP resent successfully"
          : "OTP regenerated, but the email could not be sent. Please try again or contact support.",
        data: getEmailDeliveryData(mailResult, otp),
      });
    } catch (error) {
      logger.error(`Error resending OTP: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },
  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  forgotPassword: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);

      if (!email) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_REQUIRED",
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account exists, a reset code has been sent.",
          data: {},
        });
      }

      const otp = generateOtp();
      const otpMinutes = getPasswordResetOtpMinutes();
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = getOtpExpiryDate(otpMinutes);
      await user.save();

      const mailResult = await sendMailSafely({
        from: getMailFrom(),
        to: user.email,
        subject: "JewelCancy Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">JewelCancy</h2>
            <h3>Hello ${user.username},</h3>
            <p>Use the OTP below to reset your password.</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>${otpMinutes} minutes</strong>.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
            ${getEmailFooter()}
          </div>
        `,
      }, "password reset OTP");

      return res.status(200).json({
        success: true,
        message: "If an account exists, a reset code has been sent.",
        data: getEmailDeliveryData(mailResult, otp),
      });
    } catch (error) {
      logger.error(`Error sending password reset OTP: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const submittedOtp = getSubmittedOtp(req.body);
      const { password } = req.body;

      if (!email || !submittedOtp || !password) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_OTP_PASSWORD_REQUIRED",
          message: "Email, OTP, and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_TOO_SHORT",
          message: "Password must be at least 6 characters long",
        });
      }

      const user = await User.findOne({ email })
        .select("+password +passwordResetOTP +passwordResetOTPExpires");

      const storedOtp = normalizeOtp(user?.passwordResetOTP);
      const expiresAt = user?.passwordResetOTPExpires
        ? new Date(user.passwordResetOTPExpires).getTime()
        : 0;

      if (!user || !storedOtp || storedOtp !== submittedOtp) {
        return res.status(400).json({
          success: false,
          code: "INVALID_OTP",
          message: "Invalid verification code",
        });
      }

      if (!expiresAt || expiresAt < Date.now()) {
        return res.status(400).json({
          success: false,
          code: "OTP_EXPIRED",
          message: "Verification code has expired. Please request a new OTP.",
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
        data: {},
      });
    } catch (error) {
      logger.error(`Error resetting password: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
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
      logger.error(`Error changing password: ${error.message}`, { stack: error.stack });
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
    logger.error(`Error fetching recruiters: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
};


module.exports = userController;
