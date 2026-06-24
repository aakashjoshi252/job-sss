const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  logger.warn('⚠️  Cloudinary credentials not configured. Image uploads will fail.');
  logger.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
}

// Use memory storage (no multer-storage-cloudinary needed)
const storage = multer.memoryStorage();

const parseUploadSize = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const profileImageMaxSize = parseUploadSize(process.env.PROFILE_IMAGE_MAX_SIZE, 10 * 1024 * 1024);
const companyLogoMaxSize = parseUploadSize(process.env.COMPANY_LOGO_MAX_SIZE, 10 * 1024 * 1024);
const blogImageMaxSize = parseUploadSize(process.env.BLOG_IMAGE_MAX_SIZE || process.env.MAX_FILE_SIZE, 25 * 1024 * 1024);
const resumeMaxSize = parseUploadSize(process.env.RESUME_MAX_SIZE || process.env.MAX_FILE_SIZE, 25 * 1024 * 1024);

// Multer upload configuration for profile pictures
const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: profileImageMaxSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'),
        false
      );
    }
  },
});

// Multer configuration for company logos
const uploadCompanyLogo = multer({
  storage: storage,
  limits: { fileSize: companyLogoMaxSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for logo.'), false);
    }
  },
});

// Multer configuration for blog images
const uploadBlogImage = multer({
  storage: storage,
  limits: { fileSize: blogImageMaxSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed.'),
        false
      );
    }
  },
});

// Multer configuration for resumes
const uploadResume = multer({
  storage: storage,
  limits: { fileSize: resumeMaxSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX allowed.'), false);
    }
  },
});

// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'jobs_portal',
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation || [],
        public_id: options.public_id,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          reject(error);
        } else {
          logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
          resolve(result);
        }
      }
    );

    const { Readable } = require('stream');
    const bufferStream = Readable.from(buffer);
    bufferStream.pipe(uploadStream);
  });
};

// Upload blog image with optimizations
const uploadBlogImageToCloudinary = async (buffer, fileName) => {
  try {
    const safeName = sanitizeCloudinaryFileName(fileName || 'blog-cover');
    const result = await uploadToCloudinary(buffer, {
      folder: 'job-placement/blogs',
      resource_type: 'image',
      public_id: `blog_${Date.now()}_${safeName}`,
      transformation: [
        { width: 1200, height: 630, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good' }, // Auto quality
        { fetch_format: 'auto' }, // Auto format (WebP if supported)
      ],
    });
    return result;
  } catch (error) {
    logger.error(`Blog image upload failed: ${error.message}`);
    throw error;
  }
};

const sanitizeCloudinaryFileName = (name = 'profile') => {
  const parsed = path.parse(name);
  return (
    parsed.name
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'profile'
  );
};

const uploadProfileImageToCloudinary = async (buffer, { userId, originalName } = {}) => {
  try {
    const safeName = sanitizeCloudinaryFileName(originalName);
    const result = await uploadToCloudinary(buffer, {
      folder: 'job-placement/profiles',
      resource_type: 'image',
      public_id: `${userId || 'user'}_${Date.now()}_${safeName}`,
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    return result;
  } catch (error) {
    logger.error(`Profile image upload failed: ${error.message}`);
    throw error;
  }
};

const uploadChatAttachmentToCloudinary = async (buffer, { userId, originalName } = {}) => {
  try {
    const safeName = sanitizeCloudinaryFileName(originalName || 'chat-attachment');
    const result = await uploadToCloudinary(buffer, {
      folder: 'job-placement/chat',
      resource_type: 'auto',
      public_id: `${userId || 'user'}_${Date.now()}_${safeName}`,
    });

    return result;
  } catch (error) {
    logger.error(`Chat attachment upload failed: ${error.message}`);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resourceType || options.resource_type || 'image',
    });
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting from Cloudinary: ${error.message}`);
    throw error;
  }
};

// Verify exports before exporting
if (!uploadBlogImage) {
  console.error('❌ CRITICAL: uploadBlogImage is undefined before export!');
}

// Export everything
module.exports = {
  cloudinary,
  uploadProfilePicture,
  uploadCompanyLogo,
  uploadBlogImage,
  uploadResume,
  uploadToCloudinary,
  uploadBlogImageToCloudinary,
  uploadProfileImageToCloudinary,
  uploadChatAttachmentToCloudinary,
  deleteFromCloudinary,
};

