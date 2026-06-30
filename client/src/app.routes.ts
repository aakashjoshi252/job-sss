import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

const featurePage = () => import('./shared/pages/feature-shell.page').then((m) => m.FeatureShellPageComponent);
const dashboardPage = () => import('./dashboard/pages/dashboard.page').then((m) => m.DashboardPageComponent);
const chatPage = () => import('./chat/pages/chat.page').then((m) => m.ChatPageComponent);
const notificationsPage = () => import('./notification/pages/notifications.page').then((m) => m.NotificationsPageComponent);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./shared/pages/home.page').then((m) => m.HomePageComponent), data: { preload: true, title: 'JewelCancy' } },
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./auth/pages/login.page').then((m) => m.LoginPageComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./auth/pages/register.page').then((m) => m.RegisterPageComponent) },
      { path: 'forgot-password', canActivate: [guestGuard], loadComponent: () => import('./auth/pages/forgot-password.page').then((m) => m.ForgotPasswordPageComponent) },
      { path: 'reset-password', canActivate: [guestGuard], loadComponent: () => import('./auth/pages/reset-password.page').then((m) => m.ResetPasswordPageComponent) },
      { path: 'email-verify', loadComponent: () => import('./auth/pages/verify-email.page').then((m) => m.VerifyEmailPageComponent) },
      { path: 'register/email-verify', redirectTo: 'email-verify', pathMatch: 'full' },
      { path: 'login/register', redirectTo: 'register', pathMatch: 'full' },
      { path: 'jobs/:jobId', loadComponent: () => import('./jobs/pages/job-details.page').then((m) => m.JobDetailsPageComponent) },
      { path: 'jobs', loadComponent: () => import('./jobs/pages/jobs.page').then((m) => m.JobsPageComponent), data: { preload: true } },
      { path: 'companies', loadComponent: () => import('./company/pages/companies.page').then((m) => m.CompaniesPageComponent) },
      { path: 'company/:companyId', loadComponent: () => import('./company/pages/company-details.page').then((m) => m.CompanyDetailsPageComponent) },
      { path: 'blog/:blogId', loadComponent: () => import('./blogs/pages/blog-details.page').then((m) => m.BlogDetailsPageComponent) },
      { path: 'blogs/:blogId', loadComponent: () => import('./blogs/pages/blog-details.page').then((m) => m.BlogDetailsPageComponent) },
      { path: 'blog', loadComponent: () => import('./blogs/pages/blog-list.page').then((m) => m.BlogListPageComponent), data: { preload: true } },
      { path: 'blogs', loadComponent: () => import('./blogs/pages/blog-list.page').then((m) => m.BlogListPageComponent), data: { preload: true } },
      { path: 'company-stories', redirectTo: 'blogs', pathMatch: 'full' },
      { path: 'chat', canActivate: [authGuard], loadComponent: chatPage },
      { path: 'messages', redirectTo: 'chat', pathMatch: 'full' },
      { path: 'notifications', canActivate: [authGuard], loadComponent: notificationsPage },
      { path: 'notification', redirectTo: 'notifications', pathMatch: 'full' },
      { path: 'profile', canActivate: [authGuard], loadComponent: featurePage, data: { title: 'Profile', endpoint: '/user/me' } },
      { path: 'profile/edit/:userId', canActivate: [authGuard], loadComponent: featurePage, data: { title: 'Edit Profile', endpoint: '/user/me' } },
      { path: 'settings', canActivate: [authGuard], loadComponent: featurePage, data: { title: 'Settings', description: 'Account, language, security, and notification preferences.' } },
      { path: 'saved-jobs', canActivate: [roleGuard(['candidate'])], loadComponent: featurePage, data: { title: 'Saved Jobs', endpoint: '/jobs/saved-jobs' } },
      { path: 'about', loadComponent: featurePage, data: { title: 'About JewelCancy', description: 'Recruitment workflows for the jewellery industry.' } },
      { path: 'contact', loadComponent: featurePage, data: { title: 'Contact', description: 'Reach the JewelCancy support team.' } },
      { path: 'privacy-policy', loadComponent: featurePage, data: { title: 'Privacy Policy' } },
      { path: 'faq', loadComponent: featurePage, data: { title: 'FAQ' } },
      { path: 'resources/resume-tips', loadComponent: featurePage, data: { title: 'Resume Tips' } },
      { path: 'resources/interview-tips', loadComponent: featurePage, data: { title: 'Interview Tips' } },
      { path: 'resources/salary-guide', loadComponent: featurePage, data: { title: 'Salary Guide' } }
    ]
  },
  {
    path: 'recruiter',
    canActivate: [roleGuard(['recruiter'])],
    data: { role: 'recruiter' },
    loadComponent: () => import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: dashboardPage, data: { role: 'recruiter' } },
      { path: 'company/registration', loadComponent: featurePage, data: { title: 'Company Registration', description: 'Create and maintain recruiter company profile.' } },
      { path: 'company/:companyId', loadComponent: () => import('./company/pages/company-details.page').then((m) => m.CompanyDetailsPageComponent) },
      { path: 'company/edit/:id', loadComponent: featurePage, data: { title: 'Edit Company' } },
      { path: 'profile', loadComponent: featurePage, data: { title: 'Profile', endpoint: '/user/me' } },
      { path: 'profile/edit/:userId', loadComponent: featurePage, data: { title: 'Edit Profile', endpoint: '/user/me' } },
      { path: 'settings', loadComponent: featurePage, data: { title: 'Settings' } },
      { path: 'jobpost', loadComponent: featurePage, data: { title: 'Post Job', description: 'Create a job using the existing /jobs API contract.' } },
      { path: 'company/jobpost', redirectTo: 'jobpost', pathMatch: 'full' },
      { path: 'postedjobs', loadComponent: featurePage, data: { title: 'Posted Jobs', endpoint: '/jobs' } },
      { path: 'jobs/:jobId', loadComponent: () => import('./jobs/pages/job-details.page').then((m) => m.JobDetailsPageComponent) },
      { path: 'jobs', redirectTo: 'postedjobs', pathMatch: 'full' },
      { path: 'company/postedjobs', redirectTo: 'postedjobs', pathMatch: 'full' },
      { path: 'postedjobs/edit/:jobId', loadComponent: featurePage, data: { title: 'Edit Job' } },
      { path: 'company/postedjobs/edit/:jobId', redirectTo: 'postedjobs/edit/:jobId', pathMatch: 'full' },
      { path: 'candidates-list', loadComponent: featurePage, data: { title: 'Applicants', endpoint: '/application' } },
      { path: 'applications', redirectTo: 'candidates-list', pathMatch: 'full' },
      { path: 'candidates-list/:applicationId', loadComponent: featurePage, data: { title: 'Application Details' } },
      { path: 'candidates-list/candidate/:applicationId', loadComponent: featurePage, data: { title: 'Candidate Profile' } },
      { path: 'chat', loadComponent: chatPage },
      { path: 'messages', redirectTo: 'chat', pathMatch: 'full' },
      { path: 'notifications', loadComponent: notificationsPage },
      { path: 'blogs', loadComponent: featurePage, data: { title: 'Company Blogs', endpoint: '/blogs/my/blogs' } },
      { path: 'blogs/create', loadComponent: featurePage, data: { title: 'Create Blog' } },
      { path: 'blogs/edit/:blogId', loadComponent: featurePage, data: { title: 'Edit Blog' } },
      { path: 'subscription', loadComponent: featurePage, data: { title: 'Subscription', endpoint: '/subscription/my-subscription' } },
      { path: 'subscription/plans', loadComponent: featurePage, data: { title: 'Plans', endpoint: '/subscription/plans' } },
      { path: 'subscription/plans/:planId', loadComponent: featurePage, data: { title: 'Plan Details' } },
      { path: 'subscription/checkout/:planId', loadComponent: featurePage, data: { title: 'Checkout' } },
      { path: 'subscription/payment-success', loadComponent: featurePage, data: { title: 'Payment Success' } },
      { path: 'subscription/payment-failed', loadComponent: featurePage, data: { title: 'Payment Failed' } },
      { path: 'subscription/history', loadComponent: featurePage, data: { title: 'Payment History', endpoint: '/subscription/transactions' } },
      { path: 'subscription/invoice/:paymentId', loadComponent: featurePage, data: { title: 'Invoice' } },
      { path: 'subscription/details', loadComponent: featurePage, data: { title: 'Subscription Details', endpoint: '/subscription/my-subscription' } },
      { path: 'analytics', loadComponent: dashboardPage, data: { role: 'recruiter' } },
      { path: 'interview-scheduler', loadComponent: featurePage, data: { title: 'Interview Scheduler', endpoint: '/interviews' } },
      { path: 'ats-board', loadComponent: featurePage, data: { title: 'ATS Board', endpoint: '/application' } },
      { path: 'pdf-builder', loadComponent: featurePage, data: { title: 'PDF Builder', endpoint: '/pdf' } },
      { path: 'pdf-library', loadComponent: featurePage, data: { title: 'PDF Library', endpoint: '/pdf' } }
    ]
  },
  {
    path: 'candidate',
    canActivate: [roleGuard(['candidate'])],
    data: { role: 'candidate' },
    loadComponent: () => import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: dashboardPage, data: { role: 'candidate' } },
      { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
      { path: 'profile', loadComponent: featurePage, data: { title: 'Profile', endpoint: '/user/me' } },
      { path: 'profile/edit/:userId', loadComponent: featurePage, data: { title: 'Edit Profile', endpoint: '/user/me' } },
      { path: 'settings', loadComponent: featurePage, data: { title: 'Settings' } },
      { path: 'resume', loadComponent: featurePage, data: { title: 'Resume', endpoint: '/pdf' } },
      { path: 'create-resume', loadComponent: featurePage, data: { title: 'Create Resume' } },
      { path: 'edit-resume', loadComponent: featurePage, data: { title: 'Edit Resume' } },
      { path: 'jobs', loadComponent: () => import('./jobs/pages/jobs.page').then((m) => m.JobsPageComponent) },
      { path: 'job/apply', loadComponent: () => import('./jobs/pages/job-apply.page').then((m) => m.JobApplyPageComponent) },
      { path: 'job/apply/:jobId', loadComponent: () => import('./jobs/pages/job-apply.page').then((m) => m.JobApplyPageComponent) },
      { path: 'companyaboutcard/jobs/apply', redirectTo: 'job/apply', pathMatch: 'full' },
      { path: 'CompanyAboutCard/:jobId', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'applications', loadComponent: featurePage, data: { title: 'Applied Jobs', endpoint: '/application' } },
      { path: 'appliedJobs', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'appliedjobs', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'applications/list', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'saved-jobs', loadComponent: featurePage, data: { title: 'Saved Jobs', endpoint: '/jobs/saved-jobs' } },
      { path: 'chat', loadComponent: chatPage },
      { path: 'messages', redirectTo: 'chat', pathMatch: 'full' },
      { path: 'notifications', loadComponent: notificationsPage }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['admin'])],
    data: { role: 'admin' },
    loadComponent: () => import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', loadComponent: dashboardPage, data: { role: 'admin' } },
      { path: 'users', loadComponent: featurePage, data: { title: 'Users', endpoint: '/admin/users' } },
      { path: 'companies', loadComponent: featurePage, data: { title: 'Companies', endpoint: '/admin/companies' } },
      { path: 'jobs', loadComponent: featurePage, data: { title: 'Jobs', endpoint: '/admin/jobs' } },
      { path: 'applications', loadComponent: featurePage, data: { title: 'Applications', endpoint: '/admin/applications' } },
      { path: 'subscriptions', loadComponent: featurePage, data: { title: 'Subscriptions', endpoint: '/admin/subscriptions' } },
      { path: 'reports', loadComponent: featurePage, data: { title: 'Reports', endpoint: '/admin/reports' } },
      { path: 'blogs', loadComponent: featurePage, data: { title: 'Blogs', endpoint: '/blogs/manage/all' } },
      { path: 'blogs/create', loadComponent: featurePage, data: { title: 'Create Blog' } },
      { path: 'blogs/edit/:blogId', loadComponent: featurePage, data: { title: 'Edit Blog' } },
      { path: 'professions', loadComponent: featurePage, data: { title: 'Job Professions', endpoint: '/admin/job-professions' } },
      { path: 'analytics', loadComponent: featurePage, data: { title: 'Analytics', endpoint: '/admin/analytics' } },
      { path: 'profile', loadComponent: featurePage, data: { title: 'Profile', endpoint: '/user/me' } },
      { path: 'profile/edit/:userId', loadComponent: featurePage, data: { title: 'Edit Profile', endpoint: '/user/me' } },
      { path: 'settings', loadComponent: featurePage, data: { title: 'Settings' } }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found.page').then((m) => m.NotFoundPageComponent)
  }
];
