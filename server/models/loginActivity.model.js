const mongoose = require("mongoose");

const retentionDays = Math.max(
  Number.parseInt(process.env.LOGIN_ACTIVITY_RETENTION_DAYS || "180", 10),
  1
);

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin", "unknown"],
      default: "unknown",
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    device: {
      type: String,
      default: "Unknown device",
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
      default: "unknown",
      index: true,
    },
    browser: {
      type: String,
      default: "Unknown browser",
      trim: true,
    },
    os: {
      type: String,
      default: "Unknown OS",
      trim: true,
    },
    country: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    timezone: {
      type: String,
      default: "",
      trim: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },
    isp: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      index: true,
    },
    suspicious: {
      type: Boolean,
      default: false,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    loginTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      default: "",
      trim: true,
    },
    approximate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

loginActivitySchema.index({ userId: 1, loginTime: -1 });
loginActivitySchema.index({ email: 1, loginTime: -1 });
loginActivitySchema.index({ ipAddress: 1, createdAt: -1 });
loginActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });

module.exports = mongoose.model("LoginActivity", loginActivitySchema);
