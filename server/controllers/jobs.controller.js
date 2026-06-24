const Job = require("../models/jobs.model")
const Application = require("../models/application.model")
const User = require("../models/user.model")
const {
  notifyAdminsAboutJob,
  notifySubscriptionLimit80,
  notifySubscriptionLimitReached,
} = require("../utils/notificationHelper")
const {
  SubscriptionError,
  runWithOptionalTransaction,
} = require("../services/subscription.service")
const {
  buildPublicJobsQuery,
  buildExpiredJobsQuery,
  isJobExpired,
  isPubliclyVisibleJob,
  normalizeJobStatus,
  sanitizeJobForViewer,
} = require("../utils/jobVisibility")
const logger = require("../utils/logger")

const parseCsv = (value) =>
  typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

const buildJobSearchQuery = (filters = {}, baseQuery = buildPublicJobsQuery(), options = {}) => {
  const {
    keyword,
    search,
    location,
    jobProfession,
    experience,
    empType,
    company,
    skills,
    salaryType,
    minSalary,
    maxSalary,
  } = filters;

  const query = { $and: [...(baseQuery.$and || [])] };
  const keywordValue = keyword || search;
  const includeCompanySearch = options.includeCompanySearch === true;

  if (keywordValue) {
    const keywordClauses = [
      { title: { $regex: keywordValue, $options: "i" } },
      { description: { $regex: keywordValue, $options: "i" } },
      { jobProfession: { $regex: keywordValue, $options: "i" } },
      { skills: { $in: [new RegExp(keywordValue, "i")] } },
    ];
    if (includeCompanySearch) {
      keywordClauses.push({ companyName: { $regex: keywordValue, $options: "i" } });
    }
    query.$and.push({ $or: keywordClauses });
  }

  if (location) query.$and.push({ jobLocation: { $regex: location, $options: "i" } });
  if (jobProfession) query.$and.push({ jobProfession });
  if (experience) query.$and.push({ experience });
  if (empType) query.$and.push({ empType });
  if (company && includeCompanySearch) {
    query.$and.push({ companyName: { $regex: company, $options: "i" } });
  }

  const requestedSkills = parseCsv(skills);
  if (requestedSkills.length) {
    query.$and.push({
      skills: {
        $all: requestedSkills.map((skill) => new RegExp(skill, "i")),
      },
    });
  }

  if (salaryType && ["monthly", "hourly", "perPiece", "contract"].includes(salaryType)) {
    query.$and.push({
      $or: [
        { [`salary.${salaryType}.min`]: { $exists: true } },
        { [`salary.${salaryType}.max`]: { $exists: true } },
      ],
    });
  }

  const minimumSalary = Number(minSalary);
  const maximumSalary = Number(maxSalary);
  const salaryTypes = salaryType && salaryType !== "all"
    ? [salaryType]
    : ["monthly", "hourly", "perPiece", "contract"];

  if (Number.isFinite(minimumSalary) || Number.isFinite(maximumSalary)) {
    query.$and.push({
      $or: salaryTypes
        .filter((type) => ["monthly", "hourly", "perPiece", "contract"].includes(type))
        .map((type) => {
          const clauses = [];
          if (Number.isFinite(minimumSalary)) {
            clauses.push({ [`salary.${type}.max`]: { $gte: minimumSalary } });
          }
          if (Number.isFinite(maximumSalary)) {
            clauses.push({ [`salary.${type}.min`]: { $lte: maximumSalary } });
          }
          return clauses.length === 1 ? clauses[0] : { $and: clauses };
        }),
    });
  }

  return query.$and.length ? query : {};
};

const populateJobQuery = (query) =>
  query
    .populate("companyId", "companyName location logo uploadLogo")
    .populate("recruiterId", "username email phone profilePicture profileImage");

const addApplicantCounts = async (jobs) => {
  const jobIds = jobs.map((job) => job._id);
  if (!jobIds.length) return new Map();

  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((item) => [String(item._id), item.count]));
};

const fetchJobsPage = async (query, page, limit, viewer = null) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [jobs, total] = await Promise.all([
    populateJobQuery(Job.find(query))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Job.countDocuments(query),
  ]);

  return {
    jobs: jobs.map((job) => sanitizeJobForViewer(job, viewer)),
    pagination: {
      currentPage: safePage,
      totalPages: Math.ceil(total / safeLimit),
      totalJobs: total,
      jobsPerPage: safeLimit,
    },
  };
};

const syncExpiredJobs = async () => {
  const now = new Date();
  await Job.updateMany(
    {
      status: { $nin: ["expired"] },
      $or: [
        { expiresAt: { $lte: now } },
        { deadline: { $lte: now } },
      ],
    },
    { $set: { status: "expired", isExpired: true } }
  );
};

const buildJobResponse = (job, viewer, extra = {}) => ({
  ...sanitizeJobForViewer(job, viewer),
  ...extra,
});

const jobsController = ({
  createJob: async (req, res) => {
    try {
      logger.info("Creating job", { recruiterId: req.user._id.toString() });

      const {
        // Basic Job Details
        title,
        description,

        // JEWELRY INDUSTRY SPECIFIC FIELDS
        jobProfession, // Changed from jewelryCategory
        // GENERAL JOB FIELDS
        jobLocation,
        empType = "Full-time",
        experience = "Fresher-0",

        // Salary Fields - New nested structure
        salary = {},

        // Additional Job Details
        openings = 1,
        deadline,
        expiresAt,
        skills = [],
        additionalRequirement = "",

        // Company Information
        companyId,
        recruiterId,
        companyName,
        companyEmail,
        companyAddress,
        companyWebsite,
        companyDescription,
      } = req.body;

      // Required Field Validation
      const requiredFields = {
        title: !title,
        description: !description,
        jobLocation: !jobLocation,
        companyId: !companyId,
        jobProfession: !jobProfession,
        companyName: !companyName,
        companyEmail: !companyEmail
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, isMissing]) => isMissing)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing",
          missing: requiredFields
        });
      }
      // Skills validation
      const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : []);
      if (skillsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one skill is required"
        });
      }

      // Salary validation - check if at least one salary type has values
      const hasAnySalary = Object.values(salary).some(
        type => type?.min !== undefined || type?.max !== undefined
      );

      if (!hasAnySalary) {
        return res.status(400).json({
          success: false,
          message: "At least one salary type must be specified"
        });
      }

      // Validate each salary type's range (if both min and max provided)
      const salaryTypes = ['monthly', 'hourly', 'perPiece', 'contract'];
      for (const type of salaryTypes) {
        const salaryType = salary[type];
        if (salaryType) {
          if (salaryType.min !== undefined && salaryType.max !== undefined) {
            if (salaryType.min >= salaryType.max) {
              return res.status(400).json({
                success: false,
                message: `Maximum salary must be greater than minimum salary for ${type}`
              });
            }
          }
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(companyEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company email format"
        });
      }

      // Openings validation
      if (openings < 1) {
        return res.status(400).json({
          success: false,
          message: "Number of openings must be at least 1"
        });
      }

      // Process salary - ensure numbers
      const processedSalary = {};
      salaryTypes.forEach(type => {
        if (salary[type]) {
          processedSalary[type] = {};
          if (salary[type].min !== undefined) {
            processedSalary[type].min = Number(salary[type].min);
          }
          if (salary[type].max !== undefined) {
            processedSalary[type].max = Number(salary[type].max);
          }
          // Remove if both are undefined
          if (Object.keys(processedSalary[type]).length === 0) {
            delete processedSalary[type];
          }
        }
      });

      const jobPayload = {
        // Basic Job Details
        title,
        description,

        // JEWELRY INDUSTRY SPECIFIC FIELDS
        jobProfession, // Changed from jewelryCategory
        // GENERAL JOB FIELDS
        jobLocation,
        empType,
        experience,

        // Salary Fields - Nested structure
        salary: processedSalary,

        // Additional Job Details
        openings: Number(openings),
        deadline: deadline || expiresAt || undefined,
        expiresAt: expiresAt || deadline || undefined,
        skills: skillsArray,
        status: "active",
        ...(additionalRequirement && { additionalRequirement }),

        // Company Information
        companyId,
        recruiterId: req.user._id,
        companyName,
        companyEmail,
        ...(companyAddress && { companyAddress }),
        ...(companyWebsite && { companyWebsite }),
        ...(companyDescription && { companyDescription }),
      };

      let usageResult = null;
      const createJobWithUsage = async (session = null) => {
        let createdJob = null;

        try {
          [createdJob] = await Job.create([jobPayload], session ? { session } : {});

          if (req.recordJobPostUsage) {
            usageResult = await req.recordJobPostUsage(createdJob, session);
          }

          return createdJob;
        } catch (error) {
          if (!session && createdJob?._id) {
            await Job.deleteOne({ _id: createdJob._id });
          }
          throw error;
        }
      };

      const newJob = await runWithOptionalTransaction(createJobWithUsage);

      logger.info("Job created successfully", { jobId: newJob._id.toString() });

      const adminIds = await User.find({ role: "admin" }).distinct("_id");
      if (adminIds.length > 0) {
        await notifyAdminsAboutJob(newJob, adminIds);
      }

      if (usageResult?.subscription && !usageResult.subscription.isUnlimited) {
        const used = usageResult.subscription.currentMonthPostedCount || 0;
        const limit = usageResult.subscription.jobPostLimit || 0;
        const percentUsed = limit ? Math.round((used / limit) * 100) : 0;

        if (usageResult.subscription.remainingPosts === 0) {
          await notifySubscriptionLimitReached(req.user._id, usageResult.subscription);
        } else if (percentUsed >= 80) {
          await notifySubscriptionLimit80(req.user._id, usageResult.subscription);
        }
      }

      return res.status(201).json({
        success: true,
        message: "💎 Jewelry job posted successfully!",
        job: newJob,
      });

    } catch (error) {
      logger.error(`Create job error: ${error.message}`, { stack: error.stack });

      if (error instanceof SubscriptionError) {
        return res.status(error.status).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Duplicate entry found",
          field: Object.keys(error.keyPattern)[0]
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error creating job",
        error: error.message,
      });
    }
  },

  fetchJobs: async (req, res) => {
    try {
      await syncExpiredJobs();
      const query = buildJobSearchQuery(req.query, buildPublicJobsQuery(), {
        includeCompanySearch: Boolean(req.user),
      });
      const { jobs } = await fetchJobsPage(query, req.query.page, req.query.limit, req.user);
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching jobs", error });
    }
  },

  fetchCandidateJobs: async (req, res) => {
    try {
      await syncExpiredJobs();
      if (!req.user?.jobProfession) {
        return res.status(400).json({
          success: false,
          message: "Select a job profession before browsing candidate recommendations",
        });
      }

      const query = buildJobSearchQuery({
        ...req.query,
        jobProfession: req.user.jobProfession,
      }, buildPublicJobsQuery(), { includeCompanySearch: true });
      const { jobs, pagination } = await fetchJobsPage(query, req.query.page, req.query.limit, req.user);

      return res.status(200).json({
        success: true,
        data: jobs,
        pagination,
        filters: {
          jobProfession: req.user.jobProfession,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching candidate jobs",
        error: error.message,
      });
    }
  },

  fetchJobById: async (req, res) => {
    try {
      await syncExpiredJobs();
      const { id } = req.params;
      const job = await populateJobQuery(Job.findById(id));

      if (!job) return res.status(404).json({ message: "Job not found" });

      const isOwner = req.user?.role === "recruiter"
        && String(job.recruiterId?._id || job.recruiterId) === String(req.user._id);
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin && !isPubliclyVisibleJob(job)) {
        return res.status(404).json({
          success: false,
          code: isJobExpired(job) ? "JOB_EXPIRED" : "JOB_NOT_AVAILABLE",
          message: "Job not found",
        });
      }

      res.status(200).json(buildJobResponse(job, req.user));
    } catch (error) {
      res.status(500).json({ message: "Error fetching job", error });
    }
  },

  // Fetch featured jobs (most recent or most openings)
  fetchFeaturedJobs: async (req, res) => {
    try {
      await syncExpiredJobs();
      const limit = parseInt(req.query.limit) || 6;

      // Fetch jobs with most openings and recent postings
      const featuredJobs = await populateJobQuery(Job.find(buildPublicJobsQuery()))
        .sort({ openings: -1, createdAt: -1 })
        .limit(limit);

      res.status(200).json({
        success: true,
        count: featuredJobs.length,
        data: featuredJobs.map((job) => sanitizeJobForViewer(job, req.user)),
      });
    } catch (error) {
      logger.error(`Fetch featured jobs error: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: "Error fetching featured jobs",
        error: error.message
      });
    }
  },

  fetchLatestJobs: async (req, res) => {
    try {
      await syncExpiredJobs();
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
      const latestJobs = await populateJobQuery(Job.find(buildPublicJobsQuery()))
        .sort({ createdAt: -1 })
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: latestJobs.length,
        data: latestJobs.map((job) => sanitizeJobForViewer(job, req.user)),
      });
    } catch (error) {
      logger.error(`Fetch latest jobs error: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        message: "Error fetching latest jobs",
        error: error.message,
      });
    }
  },

  // Get job categories with counts
  fetchJobCategories: async (_req, res) => {
    try {
      await syncExpiredJobs();
      const publicMatch = { $match: buildPublicJobsQuery() };
      // Job professions categories
      const categoriesByProfession = await Job.aggregate([
        publicMatch,
        {
          $group: {
            _id: "$jobProfession",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Experience levels
      const categoriesByExperience = await Job.aggregate([
        publicMatch,
        {
          $group: {
            _id: "$experience",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      const categoriesByEmpType = await Job.aggregate([
        publicMatch,
        {
          $group: {
            _id: "$empType",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Top skills
      const topSkills = await Job.aggregate([
        publicMatch,
        { $unwind: "$skills" },
        {
          $group: {
            _id: "$skills",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            skill: "$_id",
            count: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          jobProfessions: categoriesByProfession,
          experience: categoriesByExperience,
          employmentType: categoriesByEmpType,
          topSkills: topSkills
        },
      });
    } catch (error) {
      logger.error(`Fetch categories error: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: "Error fetching job categories",
        error: error.message
      });
    }
  },

  fetchJobsByRecruiter: async (req, res) => {
    try {
      await syncExpiredJobs();
      const { recruiterId } = req.params;
      if (!recruiterId) {
        return res.status(400).json({ message: "Recruiter ID required!" });
      }

      const isOwner = req.user?.role === "recruiter" && String(req.user._id) === String(recruiterId);
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          code: "RECRUITER_JOBS_FORBIDDEN",
          message: "Not authorized to view these recruiter jobs",
        });
      }

      const jobs = await populateJobQuery(Job.find({ recruiterId: recruiterId }))
        .sort({ createdAt: -1 });
      const applicantCounts = await addApplicantCounts(jobs);

      res.status(200).json({
        success: true,
        data: jobs.map((job) => buildJobResponse(job, req.user, {
          applicantsCount: applicantCounts.get(String(job._id)) || 0,
        })),
      });
    } catch (error) {
      logger.error(`Fetch recruiter jobs error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: "Server error", error });
    }
  },

  fetchJobsByCompany: async (req, res) => {
    try {
      await syncExpiredJobs();
      const { companyId } = req.params;
      if (!companyId) {
        return res.status(400).json({ message: "Company ID required!" });
      }
      const query = {
        $and: [
          ...(buildPublicJobsQuery().$and || []),
          { companyId: companyId },
        ],
      };
      const jobs = await populateJobQuery(Job.find(query))
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: jobs.map((job) => sanitizeJobForViewer(job, req.user)),
      });
    } catch (error) {
      logger.error(`Fetch company jobs error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: "Server error", error });
    }
  },

  updateJobId: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      logger.info("Updating job", { jobId: id, recruiterId: req.user._id.toString() });

      // Handle array fields
      const arrayFields = [
        'skills'
      ];

      arrayFields.forEach(field => {
        if (updates[field] !== undefined) {
          if (typeof updates[field] === 'string') {
            try {
              updates[field] = JSON.parse(updates[field]);
            } catch {
              updates[field] = updates[field]
                .split(',')
                .map(item => item.trim())
                .filter(item => item !== '');
            }
          }
          if (!Array.isArray(updates[field])) {
            updates[field] = [updates[field]].filter(Boolean);
          }
        }
      });

      // Handle number fields
      const numberFields = ['openings'];
      numberFields.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== '') {
          updates[field] = Number(updates[field]);
        }
      });

      // Handle salary object
      if (updates.salary) {
        const salaryTypes = ['monthly', 'hourly', 'perPiece', 'contract'];
        salaryTypes.forEach(type => {
          if (updates.salary[type]) {
            if (updates.salary[type].min !== undefined) {
              updates.salary[type].min = Number(updates.salary[type].min);
            }
            if (updates.salary[type].max !== undefined) {
              updates.salary[type].max = Number(updates.salary[type].max);
            }
          }
        });
      }

      // Handle date field
      if (updates.deadline) {
        updates.deadline = new Date(updates.deadline);
      }
      if (updates.expiresAt) {
        updates.expiresAt = new Date(updates.expiresAt);
      }

      if (updates.deadline && !updates.expiresAt) updates.expiresAt = updates.deadline;
      if (updates.expiresAt && !updates.deadline) updates.deadline = updates.expiresAt;

      if (updates.status) {
        updates.status = normalizeJobStatus(updates.status);
      }

      // Validate salary if being updated
      if (updates.salary) {
        const hasAnySalary = Object.values(updates.salary).some(
          type => type?.min !== undefined || type?.max !== undefined
        );

        if (!hasAnySalary) {
          return res.status(400).json({
            message: "At least one salary type must be specified"
          });
        }

        // Validate salary ranges
        const salaryTypes = ['monthly', 'hourly', 'perPiece', 'contract'];
        for (const type of salaryTypes) {
          const salaryType = updates.salary[type];
          if (salaryType) {
            if (salaryType.min !== undefined && salaryType.max !== undefined) {
              if (salaryType.min >= salaryType.max) {
                return res.status(400).json({
                  message: `Maximum salary must be greater than minimum salary for ${type}`
                });
              }
            }
          }
        }
      }

      const effectiveExpiry = updates.expiresAt || updates.deadline;
      if (effectiveExpiry && new Date(effectiveExpiry).getTime() <= Date.now()) {
        updates.status = "expired";
        updates.isExpired = true;
      } else if (updates.status && updates.status !== "expired") {
        updates.isExpired = false;
      }

      // Remove undefined fields
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined || updates[key] === null) {
          delete updates[key];
        }
      });

      // Add timestamps
      updates.updatedAt = new Date();

      const updatedJob = await Job.findOneAndUpdate(
        { _id: id, recruiterId: req.user._id },
        updates,
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      );

      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      logger.info("Job updated successfully", { jobId: updatedJob._id.toString() });

      return res.status(200).json({
        success: true,
        message: "Job updated successfully",
        job: sanitizeJobForViewer(updatedJob, req.user),
      });

    } catch (error) {
      logger.error(`Update job error: ${error.message}`, { stack: error.stack });

      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Duplicate entry found",
          field: Object.keys(error.keyPattern)[0]
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: "Invalid job ID format"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error updating job",
        error: error.message
      });
    }
  },

  deleteJobId: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedJob = await Job.findOneAndDelete({ _id: id, recruiterId: req.user._id });
      if (!deletedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Job deleted successfully"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting job",
        error
      });
    }
  },

  // Get job count
  getJobCount: async (_req, res) => {
    try {
      await syncExpiredJobs();
      const count = await Job.countDocuments(buildPublicJobsQuery());
      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching job count",
        error
      });
    }
  },

  // Search jobs with filters
  searchJobs: async (req, res) => {
    try {
      await syncExpiredJobs();
      const {
        keyword,
        location,
        jobProfession,
        experience,
        empType,
        minSalary,
        maxSalary,
        page = 1,
        limit = 10
      } = req.query;

      const query = buildJobSearchQuery({
        keyword,
        location,
        jobProfession,
        experience,
        empType,
        minSalary,
        maxSalary,
      }, buildPublicJobsQuery(), { includeCompanySearch: Boolean(req.user) });
      const { jobs, pagination } = await fetchJobsPage(query, page, limit, req.user);

      res.status(200).json({
        success: true,
        data: jobs,
        pagination,
      });
    } catch (error) {
      logger.error(`Search jobs error: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: "Error searching jobs",
        error: error.message
      });
    }
  }
});

module.exports = jobsController;
