import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Building,
  Plus,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Mail,
  User,
  Briefcase
} from "lucide-react";
import { interviewsApi, applicationApi } from "../../api/api";
import UserAvatar from "../../components/ui/UserAvatar";

const InterviewScheduler = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  
  const loggedUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    applicationId: "",
    type: "Virtual",
    scheduledAt: "",
    duration: 60,
    location: "",
    meetingLink: "",
    notes: "",
  });

  useEffect(() => {
    if (loggedUser?._id) {
      fetchInterviews();
      fetchApplications();
    }
  }, [loggedUser?._id]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await interviewsApi.get(`/recruiter/${loggedUser?._id}`);
      
      const interviewsData = res.data?.data || res.data || [];
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setError("Failed to load interviews. Please try again.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await applicationApi.get(`/recruiter/${loggedUser?._id}`);
      const applicationsData = res.data?.data || res.data || [];
      
      const shortlistedApps = applicationsData.filter(
        app => app.status === "Shortlisted" || app.status === "Interviewed"
      );
      
      setApplications(shortlistedApps);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.applicationId) {
      alert("Please select a candidate");
      return;
    }
    
    if (!formData.scheduledAt) {
      alert("Please select a date and time");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const interviewData = {
        applicationId: formData.applicationId,
        type: formData.type,
        scheduledAt: formData.scheduledAt,
        duration: parseInt(formData.duration),
        location: formData.location,
        meetingLink: formData.meetingLink,
        notes: formData.notes,
        status: "Scheduled"
      };
      
      await interviewsApi.post("/", interviewData);
      await fetchInterviews();
      resetForm();
      setShowForm(false);
      
      alert("Interview scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert(error.response?.data?.message || "Failed to schedule interview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this interview as ${status}?`)) {
      return;
    }
    
    try {
      await interviewsApi.patch(`/${id}/status`, { status });
      await fetchInterviews();
      alert(`Interview marked as ${status}`);
    } catch (error) {
      console.error("Error updating interview:", error);
      alert("Failed to update interview status");
    }
  };

  const resetForm = () => {
    setFormData({
      applicationId: "",
      type: "Virtual",
      scheduledAt: "",
      duration: 60,
      location: "",
      meetingLink: "",
      notes: "",
    });
  };

  const getInterviewIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "virtual":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "in-person":
        return <Building className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rescheduled":
        return "bg-purple-100 text-purple-800";
      case "no-show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "rescheduled":
        return <RefreshCw className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Time not set";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterviewCandidate = (interview) => interview?.candidate || interview?.applicationId?.candidateId;
  const getInterviewJob = (interview) => interview?.job || interview?.applicationId?.jobId;

  const groupedInterviews = Array.isArray(interviews)
    ? interviews.reduce((groups, interview) => {
        if (!interview?.scheduledAt) return groups;
        
        const date = new Date(interview.scheduledAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!groups[date]) groups[date] = [];
        
        groups[date].push(interview);
        return groups;
      }, {})
    : {};

  const sortedDates = Object.keys(groupedInterviews).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  // Loading State - Matching Dashboard Skeleton
  if (loading) {
    return <InterviewSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* HEADER - Matching Dashboard Header Style */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg mb-6">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Interview Scheduler</h1>
                </div>
                <p className="text-green-100 text-sm">Manage and schedule candidate interviews</p>
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-lg bg-white text-green-600 hover:bg-green-50 transition font-medium flex items-center gap-2 shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Interview
              </button>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={fetchInterviews}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* SCHEDULE FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Schedule New Interview</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Candidate Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Select Candidate *
                  </label>
                  <select
                    value={formData.applicationId}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a candidate</option>
                    {applications.map((app) => (
                      <option key={app._id} value={app._id}>
                        {app.candidate?.username || "Unknown"} - {app.job?.title || "No Job"}
                      </option>
                    ))}
                  </select>
                  {applications.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No shortlisted candidates available. Please shortlist candidates first.
                    </p>
                  )}
                </div>

                {/* Interview Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Interview Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Virtual">Virtual (Video Call)</option>
                    <option value="Phone">Phone Call</option>
                    <option value="In-person">In-person</option>
                    <option value="Technical">Technical</option>
                    <option value="HR">HR Round</option>
                  </select>
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Date and Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) })
                    }
                    min="15"
                    max="480"
                    step="15"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Location/Meeting Link */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    {formData.type === "Virtual" ? "Meeting Link" : "Location"}
                  </label>
                  <input
                    type="text"
                    value={formData.type === "Virtual" ? formData.meetingLink : formData.location}
                    onChange={(e) => {
                      if (formData.type === "Virtual") {
                        setFormData({ ...formData, meetingLink: e.target.value });
                      } else {
                        setFormData({ ...formData, location: e.target.value });
                      }
                    }}
                    placeholder={formData.type === "Virtual" ? "https://meet.example.com/..." : "Office address or meeting location"}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Notes / Instructions
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows="3"
                    placeholder="Any additional notes or instructions for the candidate..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || applications.length === 0}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium shadow-sm"
                  >
                    {submitting ? "Scheduling..." : "Schedule Interview"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INTERVIEW DETAIL MODAL */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Interview Details</h2>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Candidate Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Candidate Information</h3>
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <UserAvatar user={getInterviewCandidate(selectedInterview)} className="h-10 w-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {getInterviewCandidate(selectedInterview)?.username || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {getInterviewCandidate(selectedInterview)?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Position:</strong> {getInterviewJob(selectedInterview)?.title || "No job title"}
                  </p>
                </div>

                {/* Interview Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Interview Details</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <strong>Date:</strong> {formatDate(selectedInterview.scheduledAt)}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <strong>Time:</strong> {formatTime(selectedInterview.scheduledAt)}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      {getInterviewIcon(selectedInterview.type)}
                      <strong>Type:</strong> {selectedInterview.type}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <strong>Duration:</strong> {selectedInterview.duration} minutes
                    </p>
                    {selectedInterview.location && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <strong>Location:</strong> {selectedInterview.location}
                      </p>
                    )}
                    {selectedInterview.meetingLink && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Video className="w-4 h-4 text-gray-400" />
                        <strong>Meeting Link:</strong>{" "}
                        <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Join Meeting
                        </a>
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong>{" "}
                      <span className={`px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1 ${getStatusColor(selectedInterview.status)}`}>
                        {getStatusIcon(selectedInterview.status)}
                        {selectedInterview.status}
                      </span>
                    </p>
                    {selectedInterview.notes && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>Notes:</strong> {selectedInterview.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
                  {selectedInterview.status === "Scheduled" && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedInterview._id, "Completed");
                          setSelectedInterview(null);
                        }}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedInterview._id, "Cancelled");
                          setSelectedInterview(null);
                        }}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Cancel Interview
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedInterview(null);
                      setFormData({
                        applicationId: selectedInterview.applicationId,
                        type: selectedInterview.type,
                        scheduledAt: "",
                        duration: selectedInterview.duration,
                        location: selectedInterview.location || "",
                        meetingLink: selectedInterview.meetingLink || "",
                        notes: selectedInterview.notes || "",
                      });
                      setShowForm(true);
                    }}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTERVIEWS LIST */}
        {sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  {date}
                </h2>
                
                <div className="grid gap-3">
                  {groupedInterviews[date].map((interview) => (
                    <div
                      key={interview._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedInterview(interview)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <UserAvatar user={getInterviewCandidate(interview)} className="h-10 w-10 text-sm" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {getInterviewCandidate(interview)?.username || "Unknown Candidate"}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {getInterviewJob(interview)?.title || "No Job Title"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {formatTime(interview.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              {getInterviewIcon(interview.type)}
                              {interview.type}
                            </div>
                            {interview.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                {interview.duration} min
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(interview.status)}`}>
                            {getStatusIcon(interview.status)}
                            {interview.status}
                          </span>
                          {interview.meetingLink && interview.status === "Scheduled" && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              Join Meeting
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              You haven't scheduled any interviews yet. Start by scheduling your first interview with a shortlisted candidate.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Your First Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Interview Skeleton - Matching Dashboard Skeleton
function InterviewSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 h-32 sm:h-40 animate-pulse"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-10 sm:-mt-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <div className="h-3 bg-gray-100 rounded w-16"></div>
                    <div className="h-3 bg-gray-100 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduler;
