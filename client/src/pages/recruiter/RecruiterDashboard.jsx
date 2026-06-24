import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { dashboardApi, jobsApi, interviewsApi, applicationApi, subscriptionApi } from "../../api/api";
import {
  HiChatAlt2,
  HiPlus,
  HiBriefcase,
  HiDocumentText,
  HiCheckCircle,
  HiChartBar,
  HiUserGroup,
  HiOfficeBuilding,
  HiCog,
  HiLocationMarker,
  HiCurrencyDollar,
  HiUsers,
  HiOutlineDocumentText,
  HiLightBulb,
  HiChevronRight,
  HiCalendar,
  HiTrendingUp,
  HiClock
} from "react-icons/hi";
import { GiDiamondRing } from "react-icons/gi";
import UserAvatar from "../../components/ui/UserAvatar";

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === "true";
const debugLog = (...args) => {
  if (DEBUG_MODE) console.log(...args);
};
const debugWarn = (...args) => {
  if (DEBUG_MODE) console.warn(...args);
};
const debugError = (...args) => {
  if (DEBUG_MODE) console.error(...args);
};

export default function RecruiterDashboard() {
  const { token, user: loggedUser, isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const company = useSelector((state) => state.company.data);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(true);
  const [showUserName, setShowUserName] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowUserName(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        debugLog("Fetching dashboard data");
        debugLog("User ID:", loggedUser?._id);
        debugLog("Token exists:", !!token);

        if (!loggedUser?._id || !token) {
          debugError("No user ID or token found");
          setError("Please log in to view dashboard");
          setLoading(false);
          return;
        }

        // Correct API endpoints based on your routes
        const promises = [
          dashboardApi.get("/recruiter"), // GET /api/v1/dashboard/recruiter
          jobsApi.get(`/recruiter/${loggedUser._id}`), // GET /api/v1/jobs/recruiter/:recruiterId
          interviewsApi.get(`/recruiter/${loggedUser._id}/upcoming`), // GET /api/v1/interviews/recruiter/:recruiterId/upcoming
          applicationApi.get(`/recruiter/${loggedUser._id}/recent`), // GET /api/v1/application/recruiter/:recruiterId/recent
          subscriptionApi.get("/my-subscription")
        ];

        const [statsRes, jobsRes, interviewsRes, applicationsRes, subscriptionRes] = await Promise.allSettled(promises);

        // Handle stats response
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          const statsData = statsRes.value.data.data?.stats || statsRes.value.data.data || statsRes.value.data;
          if (statsData && Object.keys(statsData).length > 0) {
            setStats(statsData);
            debugLog("Stats set:", statsData);
          } else {
            setStats({
              totalJobs: 0,
              totalApplications: 0,
              newApplications: 0,
              reviewing: 0,
              shortlisted: 0,
              interviewed: 0,
              accepted: 0,
              rejected: 0,
              activeJobs: 0
            });
          }
        } else {
          debugWarn("Stats API failed:", statsRes.status === 'rejected' ? statsRes.reason : 'No data');
          setStats({
            totalJobs: 0,
            totalApplications: 0,
            newApplications: 0,
            reviewing: 0,
            shortlisted: 0,
            interviewed: 0,
            accepted: 0,
            rejected: 0,
            activeJobs: 0
          });
        }

        // Handle jobs response
        if (jobsRes.status === 'fulfilled' && jobsRes.value?.data) {
          const jobs = jobsRes.value.data.data || jobsRes.value.data || [];
          setRecentJobs(Array.isArray(jobs) ? jobs.slice(0, 5) : []);
          debugLog("Jobs set:", jobs.length || 0);

          // Calculate top performing jobs
          const topPerformingJobs = (Array.isArray(jobs) ? jobs : [])
            .map(job => ({
              ...job,
              applicationCount: job.applications?.length || job.applicationCount || 0
            }))
            .sort((a, b) => b.applicationCount - a.applicationCount)
            .slice(0, 5);
          setTopJobs(topPerformingJobs);
        } else {
          debugWarn("Jobs API failed");
          setRecentJobs([]);
          setTopJobs([]);
        }

        // Handle interviews response
        if (interviewsRes.status === 'fulfilled' && interviewsRes.value?.data) {
          const interviews = interviewsRes.value.data.data || interviewsRes.value.data || [];
          setUpcomingInterviews(Array.isArray(interviews) ? interviews : []);
          debugLog("Interviews set:", interviews.length || 0);
        } else {
          debugWarn("Interviews API failed");
          setUpcomingInterviews([]);
        }

        // Handle applications response
        if (applicationsRes.status === 'fulfilled' && applicationsRes.value?.data) {
          const applications = applicationsRes.value.data.data || applicationsRes.value.data || [];
          setRecentApplications(Array.isArray(applications) ? applications : []);
          debugLog("Applications set:", applications.length || 0);
        } else {
          debugWarn("Applications API failed");
          setRecentApplications([]);
        }

        if (subscriptionRes.status === 'fulfilled' && subscriptionRes.value?.data) {
          setSubscriptionSummary(subscriptionRes.value.data.data || null);
        } else {
          setSubscriptionSummary(null);
        }

      } catch (err) {
        debugError("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard data");
        // Set default values
        setStats({
          totalJobs: 0,
          totalApplications: 0,
          newApplications: 0,
          reviewing: 0,
          shortlisted: 0,
          interviewed: 0,
          accepted: 0,
          rejected: 0,
          activeJobs: 0
        });
        setRecentJobs([]);
        setUpcomingInterviews([]);
        setRecentApplications([]);
        setTopJobs([]);
        setSubscriptionSummary(null);
      } finally {
        setLoading(false);
        debugLog("Loading complete");
      }
    };

    if (authLoading) {
      debugLog("Auth is still loading...");
      return;
    }

    if (!isAuthenticated || !loggedUser?._id || !token) {
      debugLog("User not authenticated");
      setError("Please log in to view dashboard");
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [token, loggedUser?._id, isAuthenticated, authLoading]);

  // Helper function to format salary display
  const formatSalary = (salary) => {
    if (!salary) return "Not specified";

    if (typeof salary === 'object') {
      const parts = [];

      if (salary.monthly?.min || salary.monthly?.max) {
        const min = salary.monthly.min ? `₹${salary.monthly.min.toLocaleString()}` : '';
        const max = salary.monthly.max ? `₹${salary.monthly.max.toLocaleString()}` : '';
        parts.push(`Monthly: ${min}${min && max ? ' - ' : ''}${max}`);
      }
      if (salary.hourly?.min || salary.hourly?.max) {
        const min = salary.hourly.min ? `₹${salary.hourly.min.toLocaleString()}` : '';
        const max = salary.hourly.max ? `₹${salary.hourly.max.toLocaleString()}` : '';
        parts.push(`Hourly: ${min}${min && max ? ' - ' : ''}${max}`);
      }
      if (salary.perPiece?.min || salary.perPiece?.max) {
        const min = salary.perPiece.min ? `₹${salary.perPiece.min.toLocaleString()}` : '';
        const max = salary.perPiece.max ? `₹${salary.perPiece.max.toLocaleString()}` : '';
        parts.push(`Per Piece: ${min}${min && max ? ' - ' : ''}${max}`);
      }
      if (salary.contract?.min || salary.contract?.max) {
        const min = salary.contract.min ? `₹${salary.contract.min.toLocaleString()}` : '';
        const max = salary.contract.max ? `₹${salary.contract.max.toLocaleString()}` : '';
        parts.push(`Contract: ${min}${min && max ? ' - ' : ''}${max}`);
      }

      return parts.length > 0 ? parts[0] : 'Not specified';
    }

    return `₹${Number(salary).toLocaleString()}`;
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Safe access to stats with defaults
  const applicationStats = stats || {
    totalJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewed: 0,
    accepted: 0,
    rejected: 0,
    activeJobs: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className="relative top-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white mb-4 rounded-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold mb-2 transition-all duration-700 flex items-center gap-2 
  ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
              >
                {company?.uploadLogo ? (
                  <img
                    src={company.uploadLogo}
                    alt="Company Logo"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <HiOfficeBuilding className="w-10 h-10" />
                )}

                {showUserName ? (
                  <>Welcome back, {loggedUser?.username || "User"}!</>
                ) : (
                  <>{company?.companyName || "Recruiter"}</>
                )}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/chat")}
                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition font-medium flex items-center gap-2 text-sm"
              >
                <HiChatAlt2 className="text-lg" />
                <span className="hidden sm:inline">Chats</span>
              </button>

              <button
                onClick={() => navigate("/recruiter/pdf-builder")}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-semibold flex items-center gap-2 text-sm shadow-md hover:shadow-lg"
              >
                <HiOutlineDocumentText className="text-lg" />
                <span>Resume Builder</span>
              </button>

              <button
                onClick={() => navigate("/recruiter/company/jobpost")}
                className="px-4 py-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition font-medium flex items-center gap-2 shadow-lg text-sm"
              >
                <HiPlus className="text-lg" />
                <span className="hidden sm:inline">Post Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard
            title="Total Jobs"
            value={applicationStats.totalJobs || 0}
            subValue={`${applicationStats.activeJobs || 0} active`}
            icon={<HiBriefcase />}
            color="blue"
          />
          <StatCard
            title="Applications"
            value={applicationStats.totalApplications || 0}
            subValue={`${applicationStats.newApplications || 0} new`}
            icon={<HiDocumentText />}
            color="purple"
          />
          <StatCard
            title="Shortlisted"
            value={applicationStats.shortlisted || 0}
            subValue={`${applicationStats.interviewed || 0} interviewed`}
            icon={<HiCheckCircle />}
            color="green"
          />
        </div>

        <SubscriptionStatusCard subscriptionSummary={subscriptionSummary} navigate={navigate} />

        {/* Application Funnel */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
          <FunnelCard label="New" value={applicationStats.newApplications || 0} color="yellow" />
          <FunnelCard label="Reviewing" value={applicationStats.reviewing || 0} color="blue" />
          <FunnelCard label="Shortlisted" value={applicationStats.shortlisted || 0} color="purple" />
          <FunnelCard label="Interviewed" value={applicationStats.interviewed || 0} color="indigo" />
          <FunnelCard label="Accepted" value={applicationStats.accepted || 0} color="green" />
          <FunnelCard label="Rejected" value={applicationStats.rejected || 0} color="red" />
        </div>

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <QuickActionCard
            title="Applicant Tracking"
            description="Manage applications with Kanban board"
            icon={<HiUserGroup />}
            color="blue"
            onClick={() => navigate("/recruiter/ats-board")}
            linkText="Open ATS"
          />
          <QuickActionCard
            title="Interviews"
            description={`${upcomingInterviews?.length || 0} upcoming interviews`}
            icon={<HiCalendar />}
            color="green"
            onClick={() => navigate("/recruiter/interview-scheduler")}
            linkText="View Schedule"
          />
          <QuickActionCard
            title="Analytics"
            description="View hiring metrics and insights"
            icon={<HiChartBar />}
            color="purple"
            onClick={() => navigate("/recruiter/analytics")}
            linkText="View Analytics"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Job Posts</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Your latest job postings</p>
                </div>
                <button
                  onClick={() => navigate("/recruiter/company/postedjobs")}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  View All
                  <HiChevronRight />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {recentJobs && recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <JobRow key={job._id} job={job} navigate={navigate} formatSalary={formatSalary} />
                  ))
                ) : (
                  <EmptyState
                    icon={<HiBriefcase />}
                    title="No jobs posted yet"
                    description="Start by posting your first job"
                    actionText="Post a Job"
                    action={() => navigate("/recruiter/company/jobpost")}
                  />
                )}
              </div>
            </div>

            {/* Top Performing Jobs */}
            {topJobs && topJobs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiTrendingUp className="text-purple-600" />
                  Top Performing Jobs
                </h2>
                <div className="space-y-3">
                  {topJobs.map((job, index) => (
                    <div key={job._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{job.title}</h3>
                          <p className="text-xs text-gray-500 truncate">{job.jobLocation}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-purple-600">{job.applicationCount || 0}</p>
                        <p className="text-xs text-gray-500">applications</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Applications Section */}
            {recentApplications && recentApplications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiDocumentText className="text-green-600" />
                  Recent Applications
                </h2>
                <div className="space-y-3">
                  {recentApplications.slice(0, 5).map((app) => (
                    <div key={app._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <UserAvatar user={app.candidate} className="mr-3 h-10 w-10 text-sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {app.candidate?.username || "Candidate"}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            app.status === 'Reviewing' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'Shortlisted' ? 'bg-purple-100 text-purple-700' :
                                app.status === 'Interviewed' ? 'bg-indigo-100 text-indigo-700' :
                                  app.status === 'Selected' ? 'bg-green-100 text-green-700' :
                                    app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                                      'bg-red-100 text-red-700'
                            }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{app.job?.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/recruiter/applications/${app._id}`)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions Menu */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                <QuickActionMenuItem
                  icon={<HiBriefcase />}
                  label="View All Jobs"
                  onClick={() => navigate("/recruiter/company/postedjobs")}
                />
                <QuickActionMenuItem
                  icon={<HiUserGroup />}
                  label="Browse Candidates"
                  onClick={() => navigate("/recruiter/candidates-list")}
                />
                <QuickActionMenuItem
                  icon={<HiOfficeBuilding />}
                  label="Company Profile"
                  onClick={() => navigate(`/recruiter/company/${company._id}`)}
                />
                <QuickActionMenuItem
                  icon={<HiCog />}
                  label="Settings"
                  onClick={() => navigate("/recruiter/profile")}
                />
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-4 sm:p-6 text-white">
              <h3 className="text-base sm:text-lg font-bold mb-2">Performance Overview</h3>
              <p className="text-blue-100 text-xs sm:text-sm mb-4">Your hiring stats this month</p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs sm:text-sm">
                    <span className="text-blue-100">Response Rate</span>
                    <span className="font-bold">
                      {applicationStats.totalApplications > 0
                        ? Math.round(((applicationStats.shortlisted + applicationStats.interviewed) /
                          applicationStats.totalApplications) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-300/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${applicationStats.totalApplications > 0
                          ? Math.round(((applicationStats.shortlisted + applicationStats.interviewed) /
                            applicationStats.totalApplications) * 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-400/30">
                  <div className="text-xs text-blue-100 mb-1">Active Jobs</div>
                  <div className="text-2xl sm:text-3xl font-bold">{applicationStats.activeJobs || 0}</div>
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HiCalendar className="text-green-600" />
                  Upcoming Interviews
                </h3>
                <button
                  onClick={() => navigate("/recruiter/interview-scheduler")}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All
                </button>
              </div>

              {upcomingInterviews && upcomingInterviews.length > 0 ? (
                <div className="space-y-3">
                  {upcomingInterviews.slice(0, 3).map((interview) => (
                    <div key={interview._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {interview.candidate?.username || interview.candidateId?.username || "Candidate"}
                          </h4>
                          <p className="text-xs text-gray-600">{interview.job?.title || interview.jobId?.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(interview.scheduledAt).toLocaleDateString()} at {new Date(interview.scheduledAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {interview.type || "Virtual"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <HiCalendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No upcoming interviews</p>
                </div>
              )}
            </div>

            {/* Pro Tip */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <HiLightBulb className="text-lg text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">💡 Pro Tip</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Jobs with detailed descriptions get <span className="font-semibold text-amber-700">40% more</span> quality applications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subValue, icon, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-sm`}>
          <span className="text-base sm:text-lg">{icon}</span>
        </div>
      </div>
      <div className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs text-gray-600 font-medium">{title}</div>
      {subValue && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">{subValue}</span>
        </div>
      )}
    </div>
  );
}

// Funnel Card Component
function FunnelCard({ label, value, color }) {
  const colorClasses = {
    yellow: "border-yellow-500",
    blue: "border-blue-500",
    purple: "border-purple-500",
    indigo: "border-indigo-500",
    green: "border-green-500",
    red: "border-red-500",
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} border border-gray-200 p-2 sm:p-3`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-base sm:text-lg font-bold text-gray-900">{value || 0}</p>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon, color, onClick, linkText }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-all hover:scale-[1.02] text-left w-full`}
    >
      <div className="mb-2 sm:mb-3">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold mb-1">{title}</h3>
      <p className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-3">{description}</p>
      <span className="text-xs sm:text-sm font-medium">{linkText} →</span>
    </button>
  );
}

function SubscriptionStatusCard({ subscriptionSummary, navigate }) {
  const activeSubscription = subscriptionSummary?.activeSubscription;
  const usage = subscriptionSummary?.usage;

  if (!activeSubscription) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-amber-900">Subscription required</h2>
            <p className="mt-1 text-sm text-amber-800">Choose a recruiter plan before posting jobs.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/recruiter/subscription/plans")}
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-teal-950">
            Active plan: {activeSubscription.planId?.planName || activeSubscription.planSnapshot?.planName || "Subscription"}
          </h2>
          <p className="mt-1 text-sm text-teal-800">
            {usage?.isUnlimited
              ? `Unlimited posts until ${new Date(activeSubscription.endDate).toLocaleDateString("en-IN")}`
              : `${usage?.remainingPosts || 0} posts remaining this month`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/recruiter/subscription/details")}
            className="inline-flex items-center justify-center rounded-lg border border-teal-300 bg-white px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => navigate("/recruiter/subscription/history")}
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Billing History
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick Action Menu Item
function QuickActionMenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition text-left group"
    >
      <span className="text-base sm:text-lg text-gray-600 group-hover:text-gray-900">{icon}</span>
      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{label}</span>
      <HiChevronRight className="text-gray-400 group-hover:text-gray-600 text-sm" />
    </button>
  );
}

// Job Row Component
function JobRow({ job, navigate, formatSalary }) {
  const daysAgo = Math.floor(
    (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => navigate(`/recruiter/company/postedjobs/edit/${job._id}`)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{job.title}</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex-shrink-0">
              {job.empType || job.employmentType || 'Full-time'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <HiLocationMarker className="text-sm" />
              <span className="truncate max-w-[100px]">{job.jobLocation || job.location || "Remote"}</span>
            </span>
            <span className="flex items-center gap-1">
              <HiCurrencyDollar className="text-sm" />
              <span className="truncate max-w-[120px]">{formatSalary(job.salary)}</span>
            </span>
            <span className="flex items-center gap-1">
              <HiUsers className="text-sm" />
              {job.openings || 1} {job.openings === 1 ? 'opening' : 'openings'}
            </span>
            <span className="text-gray-400">
              <HiClock className="inline mr-1 text-sm" />
              {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/recruiter/company/postedjobs/edit/${job._id}`);
          }}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition self-start sm:self-center"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon, title, description, actionText, action }) {
  return (
    <div className="p-8 sm:p-12 text-center">
      <div className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{description}</p>
      <button
        onClick={action}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm inline-flex items-center gap-2"
      >
        <HiPlus />
        {actionText}
      </button>
    </div>
  );
}

// Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32 sm:h-40 animate-pulse"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-10 sm:-mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-16"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
              <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-100 rounded w-full mb-3"></div>
              ))}
            </div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
