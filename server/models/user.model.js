const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default in queries
    },

    role: {
      type: String,
      enum: {
        values: ["candidate", "recruiter", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
      default: "candidate",
    },

    accountStatus: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
      index: true,
    },

    recruiterApprovalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
      index: true,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    jobProfession: {
      type: String,
      required: [
        function() { return this.role === "candidate"; },
        "Job profession is required for candidates",
      ],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },

    // =========================
    // EMAIL VERIFICATION FIELDS
    // =========================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOTP: {
      type: String,
      default: null,
      select: false, // Don't return OTP by default
    },

    emailVerificationOTPExpires: {
      type: Date,
      default: null,
      select: false, // Don't return OTP expiry by default
    },

    passwordResetOTP: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // =========================
    // PROFILE IMAGE
    // =========================
    profilePicture: {
      type: String,
      default: null,
    },

    profilePicturePublicId: {
      type: String,
      default: null,
      select: false, // Usually don't need to return this
    },

    profileImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      fileName: {
        type: String,
        default: "",
      },
      originalName: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        default: "",
      },
      size: {
        type: Number,
        default: 0,
      },
    },

    // =========================
    // ADDITIONAL FIELDS
    // =========================
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "Please provide a valid URL",
      ],
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },
  },
  { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// =========================
// INDEXES FOR PERFORMANCE
// =========================
usersSchema.index({ role: 1 });
usersSchema.index({ role: 1, recruiterApprovalStatus: 1 });
usersSchema.index({ createdAt: -1 });

// =========================
// VIRTUAL AVATAR
// =========================
usersSchema.virtual("avatarUrl").get(function () {
  if (this.profileImage?.url) {
    return this.profileImage.url;
  }

  if (this.profilePicture) {
    return this.profilePicture;
  }

  // Use username or email if username not available
  const name = this.username || this.email?.split('@')[0] || 'User';
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=random&size=200&bold=true`;
});

// =========================
// PRE-SAVE HOOKS (Optional)
// =========================
usersSchema.pre('save', function(next) {
  // Trim username
  if (this.username) {
    this.username = this.username.trim();
  }
  
  // Ensure jobProfession is cleared for non-candidates
  if (this.role !== 'candidate') {
    this.jobProfession = undefined;
  }
  
  next();
});

const User = mongoose.model("User", usersSchema);
module.exports = User;
