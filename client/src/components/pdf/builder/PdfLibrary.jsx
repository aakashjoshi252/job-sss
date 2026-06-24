import { useEffect, useState } from "react";
import { pdfApi } from "../../../api/api";
import { useSelector } from "react-redux";
import { 
  Download, 
  Trash2, 
  FileText, 
  User, 
  Mail, 
  Briefcase, 
  Calendar,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Eye,
  X,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ResumeLibrary = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  
  const loggedUser = useSelector((state) => state.auth.user);
  const userId = loggedUser?._id;
  const navigate = useNavigate();

  /* ================= FETCH RESUMES ================= */
  const fetchResumes = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await pdfApi.get(`/${userId}/data`);
      
      // Handle different response structures
      if (res.data && res.data.message && !res.data.data) {
        setResumes([]);
      } else {
        const resumesData = res.data?.data || res.data?.resumes || [];
        setResumes(Array.isArray(resumesData) ? resumesData : []);
      }
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchResumes();
  }, [userId]);

  /* ================= DOWNLOAD PDF ================= */
  const downloadResume = async (resumeId, name) => {
    setDownloadingId(resumeId);
    try {
      const res = await pdfApi.get(`/${resumeId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${name || "resume"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage("Resume downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Download Error:", err);
      alert("Failed to download resume");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ================= DELETE RESUME ================= */
  const deleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(id);
    try {
      await pdfApi.delete(`/${id}`);
      await fetchResumes();
      setSuccessMessage("Resume deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Delete Error:", err);
      alert(err.response?.data?.message || "Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= VIEW RESUME DETAILS ================= */
  const viewResumeDetails = (resume) => {
    setPreviewResume(resume);
  };

  /* ================= CLOSE PREVIEW ================= */
  const closePreview = () => {
    setPreviewResume(null);
  };

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /* ================= GET STATUS COLOR ================= */
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /* ================= RENDER UI ================= */
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Resume Library</h1>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              Please log in to view your resumes
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Resume Library</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your resumes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Resume Library</h1>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading resumes: {error}</p>
            <button 
              onClick={fetchResumes}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Success Message Toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Library</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage and download your professional resumes
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full ml-2">
              {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'}
            </span>
          </div>
          
          <button 
            onClick={() => navigate("/recruiter/pdf-builder")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Create New Resume
          </button>
        </div>

        {/* EMPTY STATE */}
        {resumes.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resumes Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't created any resumes yet. Create your first professional resume now!
            </p>
            <button 
              onClick={() => navigate("/recruiter/pdf-builder")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Resume
            </button>
          </div>
        )}

        {/* RESUMES GRID */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-white flex-shrink-0" />
                      <h3 className="text-white font-semibold text-lg truncate">
                        {resume.fullName || "Unnamed Resume"}
                      </h3>
                    </div>
                    <span className="text-blue-100 text-xs flex-shrink-0 ml-2">
                      {resume.createdAt && formatDate(resume.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  {/* Job Title */}
                  {resume.jobTitle && (
                    <div className="flex items-start gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {resume.jobTitle}
                      </p>
                    </div>
                  )}

                  {/* Email */}
                  {resume.email && (
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {resume.email}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.slice(0, 4).map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.skills.length > 4 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                            +{resume.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specialization */}
                  {resume.specialization?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Specialization
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.specialization.slice(0, 3).map((spec, index) => (
                          <span
                            key={index}
                            className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => viewResumeDetails(resume)}
                      className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      View
                    </button>
                    <button
                      onClick={() => downloadResume(resume._id, resume.fullName)}
                      disabled={downloadingId === resume._id}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === resume._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                    <button
                      onClick={() => deleteResume(resume._id)}
                      disabled={deletingId === resume._id}
                      className="px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === resume._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PREVIEW MODAL */}
        {previewResume && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closePreview}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <h2 className="text-white text-xl font-semibold">
                    {previewResume.fullName || "Resume Details"}
                  </h2>
                </div>
                <button
                  onClick={closePreview}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                      <p className="text-gray-900 font-medium">{previewResume.fullName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Job Title</label>
                      <p className="text-gray-900">{previewResume.jobTitle || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                      <p className="text-gray-900 break-all">{previewResume.email || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                      <p className="text-gray-900">{previewResume.phone || "Not specified"}</p>
                    </div>
                  </div>

                  {previewResume.address && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                      <p className="text-gray-900">{previewResume.address}</p>
                    </div>
                  )}

                  {previewResume.summary && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Professional Summary</label>
                      <p className="text-gray-700 text-sm leading-relaxed mt-1">{previewResume.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {previewResume.skills?.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Skills</label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {previewResume.skills.map((skill, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {previewResume.experiences?.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Experience</label>
                      <div className="space-y-3 mt-2">
                        {previewResume.experiences.map((exp, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">{exp.experienceTitle}</p>
                            <p className="text-sm text-blue-600">{exp.companyName}</p>
                            <p className="text-xs text-gray-500">{exp.duration}</p>
                            <p className="text-sm text-gray-600 mt-1">{exp.workDetails}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {previewResume.education?.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Education</label>
                      <div className="space-y-2 mt-2">
                        {previewResume.education.map((edu, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">{edu.degree}</p>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            <p className="text-xs text-gray-500">{edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {previewResume.certifications?.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Certifications</label>
                      <div className="space-y-2 mt-2">
                        {previewResume.certifications.map((cert, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">{cert.name}</p>
                            <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                            {cert.issueDate && (
                              <p className="text-xs text-gray-500">Issued: {formatDate(cert.issueDate)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  {previewResume.createdAt && (
                    <div className="pt-4 border-t border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Created</label>
                      <p className="text-sm text-gray-600">{formatDate(previewResume.createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadResume(previewResume._id, previewResume.fullName);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ResumeLibrary;
