const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, "../uploads/resumes"),
  path.join(__dirname, "../uploads/company-logos"),
  path.join(__dirname, "../uploads/chat"),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const normalizeUploadName = (name = "attachment") => {
  const parsed = path.parse(name);
  const baseName = parsed.name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "attachment";
  const ext = parsed.ext.toLowerCase().replace(/[^\w.]/g, "");

  return `${baseName}${ext}`;
};

const chatAttachmentExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".zip",
]);

const profileImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const profileImageMimes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const profileImageStorage = multer.memoryStorage();
const profileImageMaxSize = parseInt(process.env.PROFILE_IMAGE_MAX_SIZE || `${10 * 1024 * 1024}`, 10);
const chatAttachmentMaxSize = parseInt(
  process.env.CHAT_ATTACHMENT_MAX_SIZE || process.env.MAX_FILE_SIZE || `${25 * 1024 * 1024}`,
  10
);

const profileImageFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = profileImageExtensions.has(ext) && profileImageMimes.has(file.mimetype);

  if (allowed) {
    cb(null, true);
    return;
  }

  cb(new Error("Invalid profile image. Use JPG, JPEG, PNG, or WebP files."), false);
};

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: profileImageMaxSize,
    files: 1,
  },
  fileFilter: profileImageFilter,
});

const chatAttachmentMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const chatAttachmentStorage = multer.memoryStorage();

const chatAttachmentFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = chatAttachmentExtensions.has(ext) && chatAttachmentMimes.has(file.mimetype);

  if (allowed) {
    cb(null, true);
    return;
  }

  cb(new Error("Unsupported chat attachment. Use images, PDF, Word, Excel, TXT, or ZIP files."), false);
};

const uploadChatAttachment = multer({
  storage: chatAttachmentStorage,
  limits: {
    fileSize: chatAttachmentMaxSize,
    files: 1,
  },
  fileFilter: chatAttachmentFilter,
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: req.baseUrl?.includes("/chat")
          ? `File size too large. Maximum size is ${Math.round(chatAttachmentMaxSize / (1024 * 1024))}MB.`
          : `File size too large. Maximum size is ${Math.round(profileImageMaxSize / (1024 * 1024))}MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = {
  uploadProfileImage,
  uploadChatAttachment,
  handleMulterError,
  normalizeUploadName,
};
