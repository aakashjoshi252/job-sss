/**
 * Environment Variable Validation Script
 * Validates all required environment variables before server starts
 */

const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const serverEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath, quiet: true });
dotenv.config({ path: serverEnvPath, override: true, quiet: true });
dotenv.config({
  path: path.join(__dirname, '..', `.env.${process.env.NODE_ENV || 'development'}`),
  override: true,
  quiet: true,
});

// Define required environment variables schema
const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  MONGO_URL: Joi.string().uri({ scheme: [/mongodb(\+srv)?/] }).optional(),
  MONGODB_URI: Joi.string().uri({ scheme: [/mongodb(\+srv)?/] }).optional(),
  
  // Authentication
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(8).required(),
  }),
  JWT_EXPIRE: Joi.string().default('7d'),
  
  // CORS
  CLIENT_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().optional(),
  
  // Email is optional for deployment. Runtime accepts EMAIL_* or SMTP_* credentials.
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().allow('').optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().allow('').optional(),
  FROM_EMAIL: Joi.string().allow('').optional(),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASS: Joi.string().allow('').optional(),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(26214400), // 25MB
  CHAT_ATTACHMENT_MAX_SIZE: Joi.number().default(26214400),
  PROFILE_IMAGE_MAX_SIZE: Joi.number().default(10485760),
  COMPANY_LOGO_MAX_SIZE: Joi.number().default(10485760),
  BLOG_IMAGE_MAX_SIZE: Joi.number().default(26214400),
  RESUME_MAX_SIZE: Joi.number().default(26214400),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(15), // minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RAZORPAY_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  RAZORPAY_KEY_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),
})
  .unknown()
  .required();

function validateEnv() {
  console.log('🔍 Validating environment variables...');
  
  // Load .env file if exists
  const hasEnvFile = fs.existsSync(serverEnvPath) || fs.existsSync(rootEnvPath);
  if (!hasEnvFile && process.env.NODE_ENV !== 'production') {
    console.error('❌ .env file not found!');
    console.error('💡 Create one using: cp .env.example .env');
    process.exit(1);
  }
  
  // Validate environment variables
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true,
  });
  
  if (error) {
    console.error('❌ Environment validation failed:');
    error.details.forEach((detail) => {
      console.error(`   - ${detail.message}`);
    });
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  const mongoUrl = value.MONGODB_URI || value.MONGO_URL;
  if (!mongoUrl) {
    console.error('Environment validation failed: MONGODB_URI is required');
    process.exit(1);
  }
  
  // Additional security checks for production
  if (value.NODE_ENV === 'production') {
    if (value.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET must be at least 32 characters in production!');
      process.exit(1);
    }

    const hasEmailAuth =
      (value.EMAIL_USER && value.EMAIL_PASS) || (value.SMTP_USER && value.SMTP_PASS);

    if (!hasEmailAuth) {
      console.warn('Email is not configured; registration email verification will fail.');
    }

    if (
      !mongoUrl.startsWith('mongodb+srv://') &&
      !mongoUrl.includes('ssl=true') &&
      !mongoUrl.includes('tls=true')
    ) {
      console.warn('⚠️  Warning: MongoDB connection should use SSL in production');
    }
  }
  
  console.log('✅ Environment validation passed');
  console.log(`📦 Environment: ${value.NODE_ENV}`);
  console.log(`🚀 Port: ${value.PORT}`);
  
  return value;
}

// Run validation if executed directly
if (require.main === module) {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

module.exports = validateEnv;
