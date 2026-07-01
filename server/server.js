const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true, quiet: true });
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

// Database
const connectDb = require('./config/config.js');

// Middleware
const { limiter } = require('./middlewares/security');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const logger = require('./utils/logger');
const { languageMiddleware, localizedResponseMiddleware } = require('./middlewares/language.middleware');

// Routes
const userRoute = require('./routes/user.route.js');
const companyRoute = require('./routes/company.route.js');
const jobsRoute = require('./routes/jobs.route.js');
const resumeRoute = require('./routes/resume.route.js');
const applicationsRoute = require('./routes/applications.route.js');
const dashboardRoutes = require('./routes/dashboard.route.js');
const candidateRoute = require('./routes/candidate.route.js');
const chatRoute = require('./routes/chat.route.js');
const notificationRoute = require('./routes/notification.route.js');
const blogRouter = require('./routes/blog.route.js');
const healthRouter = require('./routes/health.route.js');
const adminRouter = require('./routes/admin.route.js');
const subscriptionRoute = require('./routes/subscription.route.js');
const subscriptionController = require('./controllers/subscription.controller.js');
const interviewRoutes =require('./routes/interview.route.js')
const resumeBuilderRoutes =require('./routes/resume.builder.route.js')
// Socket.IO
const { Server } = require('socket.io');
const messageController = require('./controllers/message.controller.js');
const { setIO } = require('./utils/notificationHelper.js');
const { startSubscriptionExpiryCron } = require('./services/subscriptionCron.service.js');
const User = require('./models/user.model.js');
const Chat = require('./models/chatbox.model.js');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';
const API_VERSION = '/api/v1';

const trustProxy = process.env.TRUST_PROXY || (nodeEnv === 'production' ? '1' : '');
if (trustProxy) {
  app.set('trust proxy', trustProxy === 'true' ? 1 : Number(trustProxy) || trustProxy);
}

/* ================= DATABASE CONNECTION ================= */
connectDb();

/* ================= SECURITY MIDDLEWARE ================= */
app.use(
  helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(compression());

/* ================= CORS CONFIGURATION ================= */
const parseOriginList = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultDevelopmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://172.27.128.1:5173",
];

const defaultProductionOrigins = [
  "https://jobcancy.onrender.com",
  "https://www.jewelcancy.com",
  "https://jewelcancy.com",
];

const configuredDevelopmentOrigins = parseOriginList(process.env.DEV_ALLOWED_ORIGINS);
const allowDynamicDevOrigins =
  nodeEnv !== "production" || process.env.ALLOW_LOCAL_DEV_ORIGINS === "true";

const developmentOrigins = allowDynamicDevOrigins
  ? [
      ...defaultDevelopmentOrigins,
      ...configuredDevelopmentOrigins,
      ...parseOriginList(process.env.CLIENT_URL),
    ]
  : configuredDevelopmentOrigins;

const allowedOrigins = [
  ...developmentOrigins,
  ...defaultProductionOrigins,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
  ...parseOriginList(process.env.LEGACY_ALLOWED_ORIGINS),
  ...parseOriginList(process.env.ALLOWED_ORIGINS),
].filter(Boolean);

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

const normalizedAllowedOrigins = [...new Set(allowedOrigins.map(normalizeOrigin))];

const isDevelopmentLanOrigin = (origin) => {
  if (!allowDynamicDevOrigins || !origin) return false;

  try {
    const cleanOrigin = normalizeOrigin(origin);
    return /^https?:\/\/(localhost|127\.0\.0\.1|172\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/i.test(cleanOrigin);
  } catch (_error) {
    return false;
  }
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return normalizedAllowedOrigins.includes(normalizeOrigin(origin)) || isDevelopmentLanOrigin(origin);
};
const corsOriginHandler = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }

  console.error("CORS blocked origin:", origin);
  return callback(new Error(`CORS blocked origin: ${origin}`));
};

const corsMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const corsAllowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Accept-Language',
  'X-Language',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.error("CORS blocked origin:", origin);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: corsMethods,
  allowedHeaders: corsAllowedHeaders,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Express 5 requires a regex catch-all; bare "*" throws during startup.
app.options(/.*/, cors(corsOptions));

const skipOptions = (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};

app.use(skipOptions);

/* ================= LOGGING ================= */
if (nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
      skip: (req) => req.url === '/health' || req.url === '/health/ready',
    })
  );
}

/* ================= BODY PARSING ================= */
app.post(
  `${API_VERSION}/subscription/webhook`,
  express.raw({ type: 'application/json', limit: '1mb' }),
  subscriptionController.handleWebhook
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(languageMiddleware);
app.use(localizedResponseMiddleware);

/* ================= STATIC FILES ================= */
const uploadStaticOptions = {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
};

app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles'), uploadStaticOptions));
app.use('/uploads/chat', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Chat attachments are available through the secure chat download route.',
  });
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), uploadStaticOptions));

/* ================= RATE LIMITING ================= */
app.use('/api', limiter);

/* ================= ROOT & HEALTH CHECKS ================= */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'JewelCancy API',
    version: '1.0.0',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      users: '/api/v1/user',
      companies: '/api/v1/company',
      jobs: '/api/v1/jobs',
      applications: '/api/v1/application',
      resume: '/api/v1/resume',
      chat: '/api/v1/chat',
      notifications: '/api/v1/notifications',
      subscriptions: '/api/v1/subscription',
      blog: '/api/v1/blogs',
      blogLegacy: '/api/v1/blog',
      dashboard: '/api/v1/dashboard',
      admin: '/api/v1/admin',
      interviews: '/api/v1/interviews',
      resumeBuilderRouter:'/api/v1/pdf'
    },
  });
});

app.use('/health', healthRouter);

/* ================= API v1 ROUTES ================= */
app.use(`${API_VERSION}/user`, userRoute);
app.use(`${API_VERSION}/users`, userRoute);
app.use(`${API_VERSION}/company`, companyRoute);
app.use(`${API_VERSION}/jobs`, jobsRoute);
app.use(`${API_VERSION}/resume`, resumeRoute);
app.use(`${API_VERSION}/application`, applicationsRoute);
app.use(`${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`${API_VERSION}/candidate`, candidateRoute);
app.use(`${API_VERSION}/chat`, chatRoute);
app.use(`${API_VERSION}/notifications`, notificationRoute);
app.use(`${API_VERSION}/subscription`, subscriptionRoute);
app.use(`${API_VERSION}/blogs`, blogRouter);
app.use(`${API_VERSION}/blog`, blogRouter);
app.use(`${API_VERSION}/admin`, adminRouter);
app.use(`${API_VERSION}/interviews`, interviewRoutes);
app.use(`${API_VERSION}/pdf`,resumeBuilderRoutes)


/* ================= SOCKET.IO CONFIGURATION ================= */
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: corsAllowedHeaders,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
});

const connectedUsers = new Map();
setIO(io);
try {
  startSubscriptionExpiryCron();
} catch (error) {
  logger.error(`Subscription expiry cron failed to start: ${error.message}`, { stack: error.stack });
}

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username role accountStatus');

    if (!user || user.accountStatus === 'Blocked') {
      return next(new Error('Socket user is not available'));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    return next();
  } catch (error) {
    return next(new Error('Invalid socket token'));
  }
});

app.set('io', io);

const getAuthorizedSocketChat = async (chatId, userId) => {
  if (!chatId || !userId) return null;

  return Chat.findOne({
    _id: chatId,
    participants: userId,
  });
};

/* ================= SOCKET.IO EVENT HANDLERS ================= */
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.join(`user:${socket.userId}`);
  socket.join(`user_${socket.userId}`);
  connectedUsers.set(socket.userId, socket.id);

  socket.on('userOnline', () => {
    socket.join(`user:${socket.userId}`);
    socket.join(`user_${socket.userId}`);
    connectedUsers.set(socket.userId, socket.id);
    logger.info(`User ${socket.userId} is online (Socket: ${socket.id})`);

    io.emit('userStatusChange', {
      userId: socket.userId,
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('joinChat', async (chatId) => {
    try {
      const chat = await getAuthorizedSocketChat(chatId, socket.userId);
      if (!chat) {
        socket.emit('messageError', { error: 'You cannot join this chat' });
        return;
      }

      socket.join(`chat_${chatId}`);
      logger.info(`Socket ${socket.id} joined chat ${chatId}`);
      socket.emit('joinedChat', { chatId, success: true });
    } catch (error) {
      logger.error(`Socket joinChat error: ${error.message}`);
      socket.emit('messageError', { error: 'Failed to join chat' });
    }
  });

  socket.on('leaveChat', (chatId) => {
    if (!chatId) return;
    
    socket.leave(`chat_${chatId}`);
    logger.info(`Socket ${socket.id} left chat ${chatId}`);
    socket.emit('leftChat', { chatId, success: true });
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, text } = data;
      const senderId = socket.userId;

      if (!chatId || !text?.trim()) {
        socket.emit('messageError', {
          error: 'Missing required fields',
          details: 'chatId and text are required',
        });
        return;
      }

      const chat = await getAuthorizedSocketChat(chatId, senderId);
      if (!chat) {
        socket.emit('messageError', {
          error: 'You cannot send messages to this chat',
        });
        return;
      }

      logger.info(`Message from ${senderId} in chat ${chatId}`);

      const message = await messageController.createMessage({
        chatId,
        senderId,
        text: text.trim(),
      });

      if (!message) throw new Error('Failed to create message');

      logger.info(`Message saved: ${message._id}`);

      const messageData = messageController.getSocketMessage(message);

      io.to(`chat_${chatId}`).emit('receiveMessage', messageData);
      io.to(`chat_${chatId}`).emit('newMessage', messageData);

      // Notify other participant
      if (chat) {
        const otherUserId = chat.participants.find((id) => id.toString() !== senderId);

        if (otherUserId) {
          io.to(`user:${otherUserId}`).to(`user_${otherUserId}`).emit('newMessageNotification', {
            chatId,
            message: text,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            timestamp: message.createdAt,
          });
          logger.info(`Notification sent to user ${otherUserId}`);
        }
      }

      socket.emit('messageSent', {
        success: true,
        messageId: message._id,
        timestamp: message.createdAt,
      });
    } catch (error) {
      logger.error(`Socket sendMessage error: ${error.message}`, { stack: error.stack });
      socket.emit('messageError', {
        error: error.message,
        details: 'Failed to send message. Please try again.',
      });
    }
  });

  socket.on('typing', ({ chatId }) => {
    if (!chatId || !socket.rooms.has(`chat_${chatId}`)) return;
    socket.to(`chat_${chatId}`).emit('userTyping', {
      chatId,
      userName: socket.user.username,
    });
  });

  socket.on('stopTyping', ({ chatId }) => {
    if (!chatId || !socket.rooms.has(`chat_${chatId}`)) return;
    socket.to(`chat_${chatId}`).emit('userStoppedTyping', { chatId });
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);

    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      io.emit('userStatusChange', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('error', (error) => {
    logger.error(`Socket error: ${error.message}`, { socketId: socket.id });
  });
});

/* ================= ERROR HANDLING ================= */
app.use(notFound);
app.use(errorHandler);

/* ================= GRACEFUL SHUTDOWN ================= */
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received: Closing server gracefully...`);

  const closeDatabaseAndExit = () => {
    logger.info('HTTP server closed');

    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  if (server.listening) {
    server.close(closeDatabaseAndExit);
  } else {
    closeDatabaseAndExit();
  }

  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
server.on('error', (error) => {
  logger.error(`HTTP server error: ${error.message}`, { stack: error.stack });
  gracefulShutdown('SERVER_ERROR');
});
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

/* ================= START SERVER ================= */
server.listen(port, '0.0.0.0', () => {
  logger.info(`Server started on port ${port}`);
});

module.exports = { app, server, io };
