const crypto = require("crypto");
const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/subscriptionPlan.model");
const RecruiterSubscription = require("../models/recruiterSubscription.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const JobPostUsage = require("../models/jobPostUsage.model");
const { getRazorpayInstance } = require("../config/razorpay");

const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    planName: "Starter",
    price: 599,
    currency: "INR",
    jobPostLimit: 10,
    duration: 1,
    durationType: "month",
    isUnlimited: false,
    isActive: true,
    description: "10 job posts per month",
    sortOrder: 10,
  },
  {
    planName: "Growth",
    price: 1199,
    currency: "INR",
    jobPostLimit: 50,
    duration: 1,
    durationType: "month",
    isUnlimited: false,
    isActive: true,
    description: "50 job posts per month",
    sortOrder: 20,
  },
  {
    planName: "Scale",
    price: 4999,
    currency: "INR",
    jobPostLimit: 0,
    duration: 6,
    durationType: "months",
    isUnlimited: true,
    isActive: true,
    description: "Unlimited job posts for 6 months",
    sortOrder: 30,
  },
  {
    planName: "Enterprise",
    price: 12999,
    currency: "INR",
    jobPostLimit: 0,
    duration: 1,
    durationType: "year",
    isUnlimited: true,
    isActive: true,
    description: "Unlimited job posts for 1 year",
    sortOrder: 40,
  },
];

const LEGACY_DEFAULT_PLAN_NAMES = ["Basic", "Standard", "Premium", "Business"];

class SubscriptionError extends Error {
  constructor({ code, message, status = 403 }) {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
    this.status = status;
  }
}

const getMonthKey = (date = new Date()) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
};

const calculatePlanEndDate = (plan, startDate = new Date()) => {
  const endDate = new Date(startDate);

  if (plan.durationType === "year") {
    endDate.setFullYear(endDate.getFullYear() + Number(plan.duration || 1));
    return endDate;
  }

  endDate.setMonth(endDate.getMonth() + Number(plan.duration || 1));
  return endDate;
};

const ensureDefaultSubscriptionPlans = async () => {
  await Promise.all(
    DEFAULT_SUBSCRIPTION_PLANS.map((plan) =>
      SubscriptionPlan.findOneAndUpdate(
        { planName: plan.planName },
        { $set: plan },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await SubscriptionPlan.updateMany(
    { planName: { $in: LEGACY_DEFAULT_PLAN_NAMES } },
    { $set: { isActive: false } }
  );
};

const getActiveSubscriptionForRecruiter = async (recruiterId, options = {}) => {
  const now = options.now || new Date();
  return RecruiterSubscription.findOne({
    recruiterId,
    status: "active",
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .populate("planId")
    .sort({ endDate: -1 })
    .session(options.session || null);
};

const expireDueSubscriptions = async (options = {}) => {
  const now = options.now || new Date();
  return RecruiterSubscription.updateMany(
    { status: "active", endDate: { $lte: now } },
    { $set: { status: "expired", remainingPosts: 0 } },
    { session: options.session || null }
  );
};

const expireDueSubscriptionsForRecruiter = async (recruiterId, options = {}) => {
  const now = options.now || new Date();
  return RecruiterSubscription.updateMany(
    { recruiterId, status: "active", endDate: { $lte: now } },
    { $set: { status: "expired", remainingPosts: 0 } },
    { session: options.session || null }
  );
};

const syncMonthlyWindow = async (subscription, monthKey, options = {}) => {
  if (!subscription || subscription.isUnlimited) return subscription;

  if (subscription.currentMonthKey === monthKey) return subscription;

  const updated = await RecruiterSubscription.findOneAndUpdate(
    { _id: subscription._id },
    {
      $set: {
        currentMonthKey: monthKey,
        currentMonthPostedCount: 0,
        remainingPosts: subscription.jobPostLimit,
      },
    },
    { new: true, session: options.session || null }
  ).populate("planId");

  return updated || subscription;
};

const getMonthlyUsageCount = async ({ recruiterId, subscriptionId, monthKey, session = null }) =>
  JobPostUsage.countDocuments({
    recruiterId,
    subscriptionId,
    monthKey,
    action: "job_created",
  }).session(session);

const getUsageSummary = async (recruiterId, options = {}) => {
  await expireDueSubscriptionsForRecruiter(recruiterId, options);

  const now = options.now || new Date();
  const monthKey = getMonthKey(now);
  let subscription = await getActiveSubscriptionForRecruiter(recruiterId, options);

  if (!subscription) {
    return {
      hasSubscription: false,
      subscription: null,
      monthKey,
      usedThisMonth: 0,
      totalUsed: 0,
      remainingPosts: 0,
      usagePercent: 0,
      isUnlimited: false,
      canPost: false,
    };
  }

  subscription = await syncMonthlyWindow(subscription, monthKey, options);

  const [usedThisMonth, totalUsed] = await Promise.all([
    getMonthlyUsageCount({
      recruiterId,
      subscriptionId: subscription._id,
      monthKey,
      session: options.session || null,
    }),
    JobPostUsage.countDocuments({
      recruiterId,
      subscriptionId: subscription._id,
      action: "job_created",
    }).session(options.session || null),
  ]);

  const remainingPosts = subscription.isUnlimited
    ? null
    : Math.max(Number(subscription.jobPostLimit || 0) - usedThisMonth, 0);
  const usagePercent = subscription.isUnlimited || !subscription.jobPostLimit
    ? 0
    : Math.min(Math.round((usedThisMonth / subscription.jobPostLimit) * 100), 100);

  return {
    hasSubscription: true,
    subscription,
    monthKey,
    usedThisMonth,
    totalUsed,
    remainingPosts,
    usagePercent,
    isUnlimited: subscription.isUnlimited,
    canPost: subscription.isUnlimited || remainingPosts > 0,
  };
};

const ensureCanPostJob = async (recruiterId, options = {}) => {
  const summary = await getUsageSummary(recruiterId, options);

  if (!summary.hasSubscription) {
    throw new SubscriptionError({
      code: "SUBSCRIPTION_REQUIRED",
      message: "Please purchase a subscription plan to post jobs.",
    });
  }

  if (!summary.canPost) {
    throw new SubscriptionError({
      code: "JOB_POST_LIMIT_EXCEEDED",
      message: "Your monthly job posting limit is over. Please upgrade your plan.",
    });
  }

  return summary;
};

const decrementReservation = async (subscription, monthKey) => {
  if (!subscription?._id) return;

  const update = subscription.isUnlimited
    ? { $inc: { jobsPostedCount: -1 } }
    : {
        $inc: { jobsPostedCount: -1, currentMonthPostedCount: -1 },
        $set: {
          currentMonthKey: monthKey,
          remainingPosts: Math.max((subscription.remainingPosts || 0) + 1, 0),
        },
      };

  await RecruiterSubscription.updateOne({ _id: subscription._id }, update);
};

const reserveJobPostSlot = async (subscription, monthKey, options = {}) => {
  const now = options.now || new Date();
  const session = options.session || null;

  if (subscription.isUnlimited) {
    const updated = await RecruiterSubscription.findOneAndUpdate(
      {
        _id: subscription._id,
        status: "active",
        endDate: { $gt: now },
      },
      {
        $inc: { jobsPostedCount: 1 },
        $set: { remainingPosts: null },
      },
      { new: true, session }
    );

    if (!updated) {
      throw new SubscriptionError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "Please purchase a subscription plan to post jobs.",
      });
    }

    return updated;
  }

  await syncMonthlyWindow(subscription, monthKey, { ...options, session });

  const updated = await RecruiterSubscription.findOneAndUpdate(
    {
      _id: subscription._id,
      status: "active",
      endDate: { $gt: now },
      currentMonthKey: monthKey,
      currentMonthPostedCount: { $lt: subscription.jobPostLimit },
    },
    {
      $inc: {
        jobsPostedCount: 1,
        currentMonthPostedCount: 1,
      },
    },
    { new: true, session }
  );

  if (!updated) {
    throw new SubscriptionError({
      code: "JOB_POST_LIMIT_EXCEEDED",
      message: "Your monthly job posting limit is over. Please upgrade your plan.",
    });
  }

  updated.remainingPosts = Math.max(Number(updated.jobPostLimit || 0) - updated.currentMonthPostedCount, 0);
  await updated.save({ session });
  return updated;
};

const recordJobPostUsage = async ({ recruiterId, jobId, session = null, now = new Date() }) => {
  const monthKey = getMonthKey(now);
  let subscription = await getActiveSubscriptionForRecruiter(recruiterId, { session, now });

  if (!subscription) {
    throw new SubscriptionError({
      code: "SUBSCRIPTION_REQUIRED",
      message: "Please purchase a subscription plan to post jobs.",
    });
  }

  subscription = await reserveJobPostSlot(subscription, monthKey, { session, now });

  try {
    const [usage] = await JobPostUsage.create(
      [
        {
          recruiterId,
          jobId,
          subscriptionId: subscription._id,
          planId: subscription.planId?._id || subscription.planId,
          countedAt: now,
          monthKey,
          action: "job_created",
        },
      ],
      { session }
    );

    return { usage, subscription, monthKey };
  } catch (error) {
    if (!session) {
      await decrementReservation(subscription, monthKey);
    }
    throw error;
  }
};

const isTransactionUnsupportedError = (error) =>
  /Transaction numbers|replica set|mongos|transactions are not supported|Transaction.*not supported/i.test(
    error?.message || ""
  );

const runWithOptionalTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } catch (error) {
    if (!isTransactionUnsupportedError(error)) {
      throw error;
    }

    return callback(null);
  } finally {
    session.endSession();
  }
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
};

const verifyRazorpayWebhookSignature = ({ rawBody, signature, secret }) => {
  if (!rawBody || !signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
};

const createRazorpayOrder = async ({ amountInPaise, currency = "INR", receipt, notes }) => {
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new SubscriptionError({
      code: "INVALID_PAYMENT_AMOUNT",
      message: "Subscription amount is invalid.",
      status: 400,
    });
  }

  try {
    const razorpay = getRazorpayInstance();

    return await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
      payment_capture: 1,
    });
  } catch (error) {
    if (error.code === "RAZORPAY_CONFIG_MISSING") {
      throw new SubscriptionError({
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        message: "Payment gateway is not configured. Please contact support.",
        status: 503,
      });
    }

    throw new SubscriptionError({
      code: "PAYMENT_ORDER_FAILED",
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Unable to create payment order.",
      status: 502,
    });
  }
};

const getSubscriptionReport = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenueAgg,
    monthlyRevenueAgg,
    statusAgg,
    planWiseSubscribers,
    paymentFailures,
    usageByRecruiter,
  ] = await Promise.all([
    PaymentTransaction.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, payments: { $sum: 1 } } },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: "paid", verifiedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" }, payments: { $sum: 1 } } },
    ]),
    RecruiterSubscription.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    RecruiterSubscription.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$planId", subscribers: { $sum: 1 } } },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      { $project: { _id: 0, planId: "$_id", planName: "$plan.planName", subscribers: 1 } },
      { $sort: { subscribers: -1 } },
    ]),
    PaymentTransaction.countDocuments({ status: "failed" }),
    JobPostUsage.aggregate([
      { $match: { countedAt: { $gte: monthStart } } },
      { $group: { _id: "$recruiterId", jobsPosted: { $sum: 1 } } },
      { $sort: { jobsPosted: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      {
        $project: {
          _id: 0,
          recruiterId: "$_id",
          recruiterName: "$recruiter.username",
          recruiterEmail: "$recruiter.email",
          jobsPosted: 1,
        },
      },
    ]),
  ]);

  const statusCounts = statusAgg.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    totalPayments: totalRevenueAgg[0]?.payments || 0,
    monthlyRecurringRevenue: monthlyRevenueAgg[0]?.total || 0,
    monthlyPayments: monthlyRevenueAgg[0]?.payments || 0,
    activeSubscriptions: statusCounts.active || 0,
    expiredSubscriptions: statusCounts.expired || 0,
    cancelledSubscriptions: statusCounts.cancelled || 0,
    pendingSubscriptions: statusCounts.pending || 0,
    planWiseSubscribers,
    paymentFailures,
    usageByRecruiter,
  };
};

module.exports = {
  DEFAULT_SUBSCRIPTION_PLANS,
  SubscriptionError,
  calculatePlanEndDate,
  createRazorpayOrder,
  ensureCanPostJob,
  ensureDefaultSubscriptionPlans,
  expireDueSubscriptions,
  expireDueSubscriptionsForRecruiter,
  getActiveSubscriptionForRecruiter,
  getMonthKey,
  getSubscriptionReport,
  getUsageSummary,
  recordJobPostUsage,
  runWithOptionalTransaction,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
};
