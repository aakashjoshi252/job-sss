import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { User, Mail, Phone, FileText, MessageSquare, Briefcase, Inbox, AlertCircle, X, Calendar, MapPin, DollarSign } from 'lucide-react';
import { applicationApi, dashboardApi, jobsApi } from '../../api/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';

const ATSBoard = () => {
  const [board, setBoard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState(null);
  const loggedUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const columns = [
    { id: 'Pending', title: 'New', color: 'border-l-yellow-500', bgColor: 'bg-yellow-50', icon: '📋' },
    { id: 'Reviewing', title: 'Reviewing', color: 'border-l-blue-500', bgColor: 'bg-blue-50', icon: '🔍' },
    { id: 'Shortlisted', title: 'Shortlisted', color: 'border-l-purple-500', bgColor: 'bg-purple-50', icon: '⭐' },
    { id: 'Interviewed', title: 'Interviewed', color: 'border-l-indigo-500', bgColor: 'bg-indigo-50', icon: '🎯' },
    { id: 'Selected', title: 'Selected', color: 'border-l-green-500', bgColor: 'bg-green-50', icon: '✅' },
    { id: 'Rejected', title: 'Rejected', color: 'border-l-red-500', bgColor: 'bg-red-50', icon: '❌' },
  ];

  const fetchJobs = useCallback(async () => {
    if (!loggedUser?._id) return;
    try {
      setError(null);
      const res = await jobsApi.get(`/recruiter/${loggedUser._id}`);
      const jobsData = res.data?.data || res.data || [];
      setJobs(jobsData);
      
      if (jobsData.length > 0) {
        setSelectedJob(jobsData[0]._id);
      } else {
        setSelectedJob('');
        setBoard(null);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again.');
      setJobs([]);
      setSelectedJob('');
    }
  }, [loggedUser?._id]);

  const fetchATSBoard = useCallback(async () => {
    if (!selectedJob) {
      setBoard(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await applicationApi.get(`/job/${selectedJob}`);
      const applications = res.data?.data || res.data || [];
      
      const boardData = {};
      columns.forEach(column => {
        boardData[column.id] = applications.filter(app => app.status === column.id);
      });
      
      setBoard(boardData);
    } catch (error) {
      console.error('Error fetching ATS board:', error);
      setError('Failed to load applications. Please try again.');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (selectedJob) {
      fetchATSBoard();
    }
  }, [fetchATSBoard, selectedJob]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (!board) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const newBoard = { ...board };
    const sourceColumn = [...(newBoard[source.droppableId] || [])];
    const destColumn = [...(newBoard[destination.droppableId] || [])];

    const movedApp = sourceColumn.find(app => app._id === draggableId);
    if (!movedApp) return;

    const sourceIndex = sourceColumn.findIndex(app => app._id === draggableId);
    if (sourceIndex !== -1) {
      sourceColumn.splice(sourceIndex, 1);
    }
    
    destColumn.splice(destination.index, 0, movedApp);

    newBoard[source.droppableId] = sourceColumn;
    newBoard[destination.droppableId] = destColumn;
    setBoard(newBoard);

    try {
      await applicationApi.patch(`/${draggableId}/status`, { status: destination.droppableId });
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update application status. Please try again.');
      fetchATSBoard();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Reviewing': 'bg-blue-100 text-blue-800',
      'Shortlisted': 'bg-purple-100 text-purple-800',
      'Interviewed': 'bg-indigo-100 text-indigo-800',
      'Selected': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading State
  if (loading && jobs.length === 0) {
    return <ATSSkeleton />;
  }

  // No Jobs Created Yet
  if (!loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Jobs Created Yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              You haven't created any job postings. Create your first job posting to start receiving and managing applications.
            </p>
            <button 
              onClick={() => navigate('/recruiter/company/jobpost')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Create Your First Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total applications
  const totalApplications = board ? Object.values(board).reduce((sum, col) => sum + col.length, 0) : 0;
  const hasNoApplications = board && totalApplications === 0;

  // No Applications for Selected Job
  if (!loading && selectedJob && hasNoApplications) {
    const currentJob = jobs.find(job => job._id === selectedJob);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg mb-6">
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Application Tracking System</h1>
                  <p className="text-blue-100 text-sm">Manage and track candidate applications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-medium text-gray-700">Filter by Job:</label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} ({job.applications?.length || 0} applications)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Applications Yet</h2>
            <p className="text-sm text-gray-500 mb-4">
              No candidates have applied for <strong className="text-gray-700">{currentJob?.title}</strong> yet.
            </p>
            <p className="text-xs text-gray-400">
              Share your job posting link with potential candidates to start receiving applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Board View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg mb-6">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Application Tracking System</h1>
                <p className="text-blue-100 text-sm">Drag and drop to manage candidate status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-medium text-gray-700">Filter by Job:</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} ({job.applications?.length || 0} applications)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Total Applications Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                Total: {totalApplications} applications
              </span>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-300px)]">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                  {/* Column Header */}
                  <div className={`p-4 border-b border-gray-200 ${column.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">
                        <span className="mr-2">{column.icon}</span>
                        {column.title}
                      </h3>
                      <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                        {board?.[column.id]?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Column Content */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 min-h-[500px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="space-y-3">
                          {board?.[column.id]?.length === 0 && !snapshot.isDraggingOver && (
                            <div className="text-center py-8 text-gray-400 text-xs">
                              <p>No applications</p>
                              <p className="text-xs mt-1">Drag & drop here</p>
                            </div>
                          )}
                          
                          {board?.[column.id]?.map((application, index) => (
                            <Draggable
                              key={application._id}
                              draggableId={application._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-all ${
                                    snapshot.isDragging ? 'rotate-1 scale-105 shadow-lg' : ''
                                  }`}
                                  onClick={() => setSelectedApplication(application)}
                                >
                                  <div className="p-4">
                                    {/* Candidate Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                      <UserAvatar user={application.candidate} className="h-10 w-10 text-sm" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                                          {application.candidate?.username || 'Unknown User'}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">
                                          Applied {new Date(application.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Contact Info */}
                                    <div className="space-y-1 text-xs text-gray-500 mb-3">
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{application.candidate?.email || 'No email'}</span>
                                      </div>
                                      {application.candidate?.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3 h-3 flex-shrink-0" />
                                          <span>{application.candidate.phone}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-3">
                                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                                        {application.status}
                                      </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                      {application.resumeId && (
                                        <button
                                          className="flex-1 text-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 transition"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(application.resumeId, '_blank');
                                          }}
                                        >
                                          <FileText className="w-3 h-3 inline mr-1" />
                                          Resume
                                        </button>
                                      )}
                                      <button
                                        className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedApplication(application);
                                        }}
                                      >
                                        <MessageSquare className="w-3 h-3 inline mr-1" />
                                        Details
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedApplication(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {selectedApplication.candidate?.username || 'Unknown Candidate'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedApplication.job?.title || 'No Job Title'}</p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Email:</strong> {selectedApplication.candidate?.email || 'No email provided'}
                    </p>
                    {selectedApplication.candidate?.phone && (
                      <p className="text-sm text-gray-700">
                        <strong>Phone:</strong> {selectedApplication.candidate.phone}
                      </p>
                    )}
                    {selectedApplication.candidate?.location && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedApplication.candidate.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cover Letter</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedApplication.candidate?.skills && selectedApplication.candidate.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.candidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {selectedApplication.candidate?.experience && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Experience</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.candidate.experience}
                      </p>
                    </div>
                  </div>
                )}

                {/* Application Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Application Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <span className={`px-2 py-1 text-xs rounded-full inline-block ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on {new Date(selectedApplication.createdAt).toLocaleString()}
                    </p>
                    {selectedApplication.updatedAt !== selectedApplication.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated on {new Date(selectedApplication.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Message Candidate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ATS Skeleton - Matching Dashboard Skeleton
function ATSSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32 sm:h-40 animate-pulse"></div>
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-10 sm:-mt-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-100 border-b border-gray-200">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="p-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ATSBoard; 
