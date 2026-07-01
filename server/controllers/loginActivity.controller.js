const mongoose = require("mongoose");
const LoginActivity = require("../models/loginActivity.model");
const { maskIpAddress } = require("../utils/requestIp");
const logger = require("../utils/logger");

const RETENTION_DAYS = Math.max(Number.parseInt(process.env.LOGIN_ACTIVITY_RETENTION_DAYS || "180", 10), 1);

const getPagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "20", 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

const withMeta = (payload) => ({
  ...payload,
  meta: {
    privacyLabel: "Approximate location based on IP address",
    retentionDays: RETENTION_DAYS,
  },
});

const toPlain = (activity) => (typeof activity.toObject === "function" ? activity.toObject() : activity);

const maskForUser = (activity) => {
  const plain = toPlain(activity);
  return {
    ...plain,
    ipAddress: maskIpAddress(plain.ipAddress),
    maskedIpAddress: maskIpAddress(plain.ipAddress),
  };
};

const buildAdminQuery = (queryParams = {}) => {
  const {
    role,
    status,
    suspicious,
    country,
    userId,
    search,
    dateFrom,
    dateTo,
  } = queryParams;

  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (country) query.country = { $regex: escapeRegex(country), $options: "i" };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) query.userId = userId;
  if (suspicious === "true" || suspicious === true) query.suspicious = true;
  if (suspicious === "false" || suspicious === false) query.suspicious = false;

  const from = toDate(dateFrom);
  const to = toDate(dateTo, true);
  if (from || to) {
    query.loginTime = {};
    if (from) query.loginTime.$gte = from;
    if (to) query.loginTime.$lte = to;
  }

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [
      { email: regex },
      { ipAddress: regex },
      { country: regex },
      { region: regex },
      { city: regex },
      { browser: regex },
      { os: regex },
      { isp: regex },
    ];
  }

  return query;
};

const getMyLoginActivity = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const [activities, total] = await Promise.all([
      LoginActivity.find(query).sort({ loginTime: -1 }).skip(skip).limit(limit).lean(),
      LoginActivity.countDocuments(query),
    ]);

    return res.status(200).json(
      withMeta({
        success: true,
        data: activities.map(maskForUser),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    logger.error(`Get my login activity error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Error fetching login activity",
    });
  }
};

const getAdminLoginActivity = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = buildAdminQuery(req.query);

    const [activities, total] = await Promise.all([
      LoginActivity.find(query)
        .populate("userId", "username email role profilePicture profileImage")
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginActivity.countDocuments(query),
    ]);

    return res.status(200).json(
      withMeta({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    logger.error(`Get admin login activity error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Error fetching login activity",
    });
  }
};

const getAdminLoginActivityByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { page, limit, skip } = getPagination(req.query);
    const query = buildAdminQuery({ ...req.query, userId });

    const [activities, total] = await Promise.all([
      LoginActivity.find(query)
        .populate("userId", "username email role profilePicture profileImage")
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginActivity.countDocuments(query),
    ]);

    return res.status(200).json(
      withMeta({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    logger.error(`Get user login activity error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Error fetching user login activity",
    });
  }
};

const deleteLoginActivity = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid login activity ID",
      });
    }

    const deleted = await LoginActivity.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Login activity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login activity deleted",
    });
  } catch (error) {
    logger.error(`Delete login activity error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Error deleting login activity",
    });
  }
};

module.exports = {
  deleteLoginActivity,
  getAdminLoginActivity,
  getAdminLoginActivityByUser,
  getMyLoginActivity,
};
