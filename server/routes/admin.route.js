const express = require('express');
const adminRouter = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const adminController = require('../controllers/admin.controller');
const loginActivityController = require('../controllers/loginActivity.controller');
const subscriptionController = require('../controllers/subscription.controller');

// All admin routes require authentication and admin role
adminRouter.use(protect, isAdmin);

// Dashboard & Analytics
adminRouter.get('/stats', adminController.getAdminStats);
adminRouter.get('/dashboard', adminController.getAdminStats);
adminRouter.get('/analytics', adminController.getAnalytics);
adminRouter.get('/login-activity', loginActivityController.getAdminLoginActivity);
adminRouter.get('/login-activity/:userId', loginActivityController.getAdminLoginActivityByUser);
adminRouter.delete('/login-activity/:id', loginActivityController.deleteLoginActivity);

// User Management
adminRouter.get('/users', adminController.getAllUsers);
adminRouter.get('/recruiters', (req, res) => {
  req.query = { ...req.query, role: 'recruiter' };
  return adminController.getAllUsers(req, res);
});
adminRouter.get('/candidates', (req, res) => {
  req.query = { ...req.query, role: 'candidate' };
  return adminController.getAllUsers(req, res);
});
adminRouter.get('/users/:id', adminController.getUserById);
adminRouter.put('/users/:id', adminController.updateUser);
adminRouter.delete('/users/:id', adminController.deleteUser);

// Company Management
adminRouter.get('/companies', adminController.getAllCompanies);
adminRouter.patch('/companies/:id/verify', adminController.verifyCompany);
adminRouter.delete('/companies/:id', adminController.deleteCompany);

// Job Management
adminRouter.get('/jobs', adminController.getAllJobs);
adminRouter.patch('/jobs/:id/moderation', adminController.moderateJob);
adminRouter.delete('/jobs/:id', adminController.deleteJob);
adminRouter.get('/applications', adminController.getAllApplications);
adminRouter.get('/job-professions', adminController.getJobProfessionStats);
adminRouter.get('/reports', adminController.getReportsOverview);
adminRouter.get('/reports/overview', adminController.getReportsOverview);
adminRouter.post('/reports/snapshots', adminController.createReportSnapshot);
adminRouter.get('/subscriptions', subscriptionController.getAdminSubscriptions);
adminRouter.patch('/subscriptions/:id', subscriptionController.updateAdminSubscription);
adminRouter.get('/subscription-plans', subscriptionController.getAdminPlans);
adminRouter.post('/subscription-plans', subscriptionController.createAdminPlan);
adminRouter.patch('/subscription-plans/:id', subscriptionController.updateAdminPlan);

module.exports = adminRouter;
