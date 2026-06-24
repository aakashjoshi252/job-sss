import { useEffect, useState } from "react";
import Jobs from "../jobs/Jobs";
import { jobsApi, dashboardApi, companyApi } from "../../../api/api";
import { useJobSearch } from "../../../hooks/useSearch";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getCompanyDisplayName } from "../../../utils/jobVisibility";
import {
  VscOrganization,
  VscHeart,
  VscBell,
  VscGraphLine
} from "react-icons/vsc";
import { FaRegBuilding } from "react-icons/fa";
import { MdWork, MdTrendingUp } from "react-icons/md";
import { BiTimeFive, BiChevronRight } from "react-icons/bi";
import { HiOutlineLocationMarker, HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbLogs } from "react-icons/tb";

// Constants
const FALLBACK_POPULAR_SEARCHES = [
  { skill: "React Developer", count: 150 },
  { skill: "Node.js", count: 120 },
  { skill: "UI/UX Designer", count: 80 },
  { skill: "Java Developer", count: 200 },
  { skill: "Python", count: 175 },
  { skill: "Data Scientist", count: 90 },
];

const FALLBACK_STATS = { jobs: 1250, companies: 350, candidates: 5000 };
const FALLBACK_EXPERIENCE = [
  { category: "Fresher", count: 150 },
  { category: "Junior", count: 320 },
  { category: "Mid-Level", count: 450 },
  { category: "Senior", count: 280 }
];

const FALLBACK_COMPANIES = [
  { _id: "1", name: "Tech Corp", jobCount: 45 },
  { _id: "2", name: "Design Studio", jobCount: 28 },
  { _id: "3", name: "Finance Ltd", jobCount: 32 },
  { _id: "4", name: "Health Inc", jobCount: 19 },
  { _id: "5", name: "Edu World", jobCount: 24 },
  { _id: "6", name: "Auto Mart", jobCount: 15 }
];

// Utility functions
const formatSalary = (salary) => {
  if (!salary) return "Not specified";

  if (typeof salary === 'object') {
    const salaryTypes = ['monthly', 'hourly', 'perPiece', 'contract'];
    for (const type of salaryTypes) {
      if (salary[type]?.min || salary[type]?.max) {
        const min = salary[type].min ? `₹${salary[type].min.toLocaleString()}` : '';
        const max = salary[type].max ? `₹${salary[type].max.toLocaleString()}` : '';
        return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${min}${min && max ? ' - ' : ''}${max}`;
      }
    }
    return 'Not specified';
  }

  return `₹${Number(salary).toLocaleString()}`;
};

const safeExtractNumber = (data) => {
  if (!data) return 0;

  if (typeof data === "number") return data;

  if (typeof data === "object") {
    // Common API patterns
    if (typeof data.count === "number") return data.count;
    if (typeof data.total === "number") return data.total;
    if (typeof data.data === "number") return data.data;

    // Nested case
    if (typeof data.data === "object") {
      if (typeof data.data.count === "number") return data.data.count;
      if (typeof data.data.total === "number") return data.data.total;
    }
  }

  return 0;
};

const getDaysAgo = (date) => {
  if (!date) return 2;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

// Helper function to normalize company name for comparison
const normalizeCompanyName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/(inc|ltd|llc|corp|corporation|technologies|tech|solutions|systems)$/i, '') // Remove common suffixes
    .trim();
};

// Enhanced deduplicate companies with better matching
const deduplicateCompanies = (companies) => {
  const map = new Map();
  const nameMap = new Map();

  companies.forEach((company) => {
    const rawName = company.name || company.companyName || "";
    const normalizedName = normalizeCompanyName(rawName);
    const companyId = company._id || company.id || company.companyId;

    // Skip if no name
    if (!normalizedName) return;

    // Check if we already have this company by normalized name
    if (nameMap.has(normalizedName)) {
      const existingCompany = nameMap.get(normalizedName);
      // Update job count
      existingCompany.jobCount += company.jobCount || company.jobs || 0;
      // Prefer the one with an ID
      if (companyId && !existingCompany._id) {
        existingCompany._id = companyId;
        existingCompany.id = companyId;
      }
      // Prefer the one with a logo
      if (company.logo && !existingCompany.logo) {
        existingCompany.logo = company.logo;
      }
      // Use the more complete name
      if (rawName.length > existingCompany.name.length) {
        existingCompany.name = rawName.trim();
      }
    } else {
      // New company
      const newCompany = {
        _id: companyId,
        id: companyId,
        name: rawName.trim() || "Company",
        jobCount: company.jobCount || company.jobs || 0,
        logo: company.logo || null,
      };
      map.set(companyId || normalizedName, newCompany);
      nameMap.set(normalizedName, newCompany);
    }
  });

  return Array.from(map.values());
};

// Extract unique companies from featured jobs with better deduplication
const extractCompaniesFromJobs = (jobs) => {
  const map = new Map();
  const nameMap = new Map();

  jobs.forEach((job) => {
    const rawName = job.companyName || job.company?.name || "";
    const normalizedName = normalizeCompanyName(rawName);
    const companyId = job.companyId || job.company?._id || job.company?.id;

    if (!normalizedName) return;

    if (nameMap.has(normalizedName)) {
      const existingCompany = nameMap.get(normalizedName);
      existingCompany.jobCount += 1;
      if (companyId && !existingCompany._id) {
        existingCompany._id = companyId;
        existingCompany.id = companyId;
      }
      if (job.companyLogo && !existingCompany.logo) {
        existingCompany.logo = job.companyLogo;
      }
    } else {
      const newCompany = {
        _id: companyId,
        id: companyId,
        name: rawName.trim() || "Company",
        jobCount: 1,
        logo: job.companyLogo || job.company?.logo || null,
      };
      map.set(companyId || normalizedName, newCompany);
      nameMap.set(normalizedName, newCompany);
    }
  });

  return Array.from(map.values());
};

export default function Home() {
  const navigate = useNavigate();
  const { navigateWithFilters } = useJobSearch([]);
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user);

  const [categories, setCategories] = useState(null);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [topCompanies, setTopCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchHomeData = async () => {
  try {
    setLoading(true);

    const [
      jobsCountRes,
      companiesCountRes,
      candidatesCountRes,
      recruitersCountRes,
      featuredJobsRes,
      categoriesRes,
      topCompaniesRes,
    ] = await Promise.all([
      dashboardApi.get("/jobs/count").catch(() => ({ data: { jobsCount: 0 } })),
      dashboardApi.get("/companies/count").catch(() => ({ data: { companiesCount: 0 } })),
      dashboardApi.get("/candidates/count").catch(() => ({ data: { candidatesCount: 0 } })),
      dashboardApi.get("/recruiters/count").catch(() => ({ data: { recruitersCount: 0 } })),
      jobsApi.get("/featured?limit=8").catch(() => ({ data: { success: false, data: [] } })),
      jobsApi.get("/categories").catch(() => ({ data: { success: false, data: null } })),
      companyApi.get("/top?limit=10").catch(() => ({ data: { success: false, data: [] } })),
    ]);

    // Extract numbers from API responses
    const jobsCount = jobsCountRes.data?.jobsCount || 
                     jobsCountRes.data?.data?.jobsCount || 
                     (typeof jobsCountRes.data === 'number' ? jobsCountRes.data : 0);
    
    const companiesCount = companiesCountRes.data?.companiesCount || 
                          companiesCountRes.data?.data?.companiesCount || 
                          (typeof companiesCountRes.data === 'number' ? companiesCountRes.data : 0);
    
    const candidatesCount = candidatesCountRes.data?.candidatesCount || 
                           candidatesCountRes.data?.data?.candidatesCount || 
                           (typeof candidatesCountRes.data === 'number' ? candidatesCountRes.data : 0);
    
    const recruitersCount = recruitersCountRes.data?.recruitersCount || 
                           recruitersCountRes.data?.data?.recruitersCount || 
                           (typeof recruitersCountRes.data === 'number' ? recruitersCountRes.data : 0);

    setStats({
      jobs: jobsCount,
      companies: companiesCount,
      candidates: candidatesCount,
      recruiter: recruitersCount

    });

    // Handle featured jobs
    const featuredData = featuredJobsRes.data?.success ? featuredJobsRes.data.data :
                        Array.isArray(featuredJobsRes.data) ? featuredJobsRes.data :
                        featuredJobsRes.data?.data || [];
    setFeaturedJobs(featuredData);

    // Collect companies from multiple sources
    let allCompanies = [];

    // Add companies from top companies API
    let companiesData = [];
    if (topCompaniesRes.data?.success && Array.isArray(topCompaniesRes.data.data)) {
      companiesData = topCompaniesRes.data.data;
    } else if (Array.isArray(topCompaniesRes.data)) {
      companiesData = topCompaniesRes.data;
    } else if (topCompaniesRes.data?.data && Array.isArray(topCompaniesRes.data.data)) {
      companiesData = topCompaniesRes.data.data;
    }

    if (companiesData.length > 0) {
      allCompanies.push(...companiesData);
    }

    // Add companies from featured jobs
    if (featuredData.length > 0) {
      const companiesFromJobs = featuredData.map(job => ({
        name: job.companyName || job.company?.name,
        jobCount: 1,
        logo: job.companyLogo || job.company?.logo,
        _id: job.companyId || job.company?._id || job.company?.id
      }));
      allCompanies.push(...companiesFromJobs);
    }

    // Deduplicate all companies
    let uniqueCompanies = deduplicateCompanies(allCompanies);

    // Sort by job count (highest first)
    uniqueCompanies.sort((a, b) => b.jobCount - a.jobCount);

    // Filter out companies without valid names
    uniqueCompanies = uniqueCompanies.filter(company => company.name && company.name.trim() !== "");

    // If still no companies, use fallback
    if (uniqueCompanies.length === 0) {
      setTopCompanies(FALLBACK_COMPANIES);
    } else {
      // Limit to top 6 companies
      setTopCompanies(uniqueCompanies.slice(0, 6));
    }

    // Handle categories and popular searches
    const categoriesData = categoriesRes.data?.success ? categoriesRes.data.data : categoriesRes.data;
    setCategories(categoriesData);

    if (categoriesData?.topSkills && Array.isArray(categoriesData.topSkills)) {
      setPopularSearches(categoriesData.topSkills.slice(0, 8));
    } else {
      setPopularSearches(FALLBACK_POPULAR_SEARCHES);
    }

  } catch (error) {
    console.error("Error fetching home data:", error);
    setStats(FALLBACK_STATS);
    setPopularSearches(FALLBACK_POPULAR_SEARCHES);
    setTopCompanies(FALLBACK_COMPANIES);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handlePopularSearch = (term) => {
    navigateWithFilters('/jobs', {
      searchQuery: term,
      location: ""
    });
  };

  const handleCompanyClick = (companyId, companyName) => {
    // Validate companyId
    if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
      // Check if it's a valid MongoDB ObjectId (24 hex chars)
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(companyId);

      // Check if it's a numeric ID
      const isValidNumericId = /^\d+$/.test(companyId);

      if (isValidMongoId || isValidNumericId) {
        // Valid ID format, navigate to company page
        navigate(`/company/${companyId}`);
      } else {
        // Generated ID or invalid format, navigate to companies list with search param
        console.warn('Invalid company ID format, navigating to companies list');
        if (companyName) {
          navigate(`/companies?search=${encodeURIComponent(companyName)}`);
        } else {
          navigate('/companies');
        }
      }
    } else {
      // No valid ID, navigate to companies list page
      console.warn('No valid company ID provided');
      navigate('/companies');
    }
  };

  const navigationCards = [
    { icon: MdWork, label: "All Jobs", path: "/jobs", color: "text-blue-600" },
    { icon: FaRegBuilding, label: "Companies", path: "/companies", color: "text-blue-600" },
    { icon: VscHeart, label: "Saved Jobs", path: "/jobs", color: "text-blue-600" },
    { icon: TbLogs, label: "Blogs", path: "/blogs", color: "text-blue-600" }
  ];

  const careerResources = [
    { icon: VscGraphLine, title: "Resume Tips", description: "Learn how to make your resume stand out", path: "/resources/resume-tips" },
    { icon: MdTrendingUp, title: "Interview Prep", description: "Ace your next interview with these tips", path: "/resources/interview-tips" },
    { icon: VscBell, title: "Salary Guide", description: "Check industry standard salaries", path: "/resources/salary-guide" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">


      <Jobs limit={5} />

      {/* Navigation Cards Section */}
      <section className="py-4 sm:py-6 bg-white border-b mt-6 border-gray-200 sticky top-14 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {navigationCards.map((card, idx) => (
              <button
                key={idx}
                onClick={() => navigate(card.path)}
                className="flex items-center justify-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md group"
              >
                <card.icon className={`${card.color} text-xl transition-transform group-hover:scale-110`} />
                <span className="font-medium text-sm sm:text-base text-gray-700">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Latest Jobs Section */}
      <section className="py-6 max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Latest Jobs</h2>
          <button
            onClick={() => navigate("/jobs")}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            View All <BiChevronRight className="text-xl" />
          </button>
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Companies Hiring</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <CompanySkeleton key={i} />)
            ) : topCompanies.length > 0 ? (
              topCompanies.map((company, index) => (
                <CompanyCard
                  key={company._id || company.id || `${company.name}-${index}`}
                  name={company.name}
                  jobCount={company.jobCount}
                  companyId={company._id || company.id}
                  logo={company.logo}
                  onClick={() => handleCompanyClick(company._id || company.id, company.name)}
                />
              ))
            ) : (
              FALLBACK_COMPANIES.map((company) => (
                <CompanyCard
                  key={company._id}
                  name={company.name}
                  jobCount={company.jobCount}
                  companyId={company._id}
                  onClick={() => handleCompanyClick(company._id, company.name)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Experience Levels Section */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse by Experience</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
          ) : categories?.experience?.length > 0 ? (
            categories.experience.map((cat, index) => (
              <ExperienceCard
                key={index}
                category={cat.category || cat}
                count={cat.count || 0}
                onClick={() => navigate(`/jobs?experience=${encodeURIComponent(cat.category || cat)}`)}
              />
            ))
          ) : (
            FALLBACK_EXPERIENCE.map((cat, index) => (
              <ExperienceCard
                key={index}
                category={cat.category}
                count={cat.count}
                onClick={() => navigate(`/jobs?experience=${encodeURIComponent(cat.category)}`)}
              />
            ))
          )}
        </div>
      </section>

      {/* Trending Skills Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Trending Skills</h2>
            <button
              onClick={() => navigate("/jobs")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <BiChevronRight className="text-xl" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkillSkeleton key={i} />)
            ) : (
              (popularSearches.length > 0 ? popularSearches : FALLBACK_POPULAR_SEARCHES)
                .slice(0, 8)
                .map((skill, index) => (
                  <SkillCard
                    key={index}
                    skill={skill.skill || skill}
                    count={skill.count || 50}
                    onClick={() => handlePopularSearch(skill.skill || skill)}
                  />
                ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Jobs</h2>
          <button
            onClick={() => navigate("/jobs")}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All <BiChevronRight className="text-xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <JobSkeleton key={i} />)
          ) : featuredJobs.length > 0 ? (
            featuredJobs.slice(0, 4).map((job) => (
              <FeaturedJobCard
                key={job._id}
                job={job}
                onApply={(id) => {
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: `/jobs/${id}` } });
                    return;
                  }
                  navigate(`/jobs/${id}`);
                }}
                formatSalary={formatSalary}
                getDaysAgo={getDaysAgo}
                isAuthenticated={isAuthenticated}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-500">No featured jobs available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Career Resources Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Career Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {careerResources.map((resource, idx) => (
              <ResourceCard
                key={idx}
                icon={resource.icon}
                title={resource.title}
                description={resource.description}
                onClick={() => navigate(resource.path)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatBox label="Jobs Posted" value={stats.jobs} />
              <StatBox label="Companies" value={stats.companies} />
              <StatBox label="Active Candidates" value={stats.candidates} />
              <StatBox label="Active Recruiters" value={stats.recruiter} />
              {/* {console.log("Jobs Count API:", jobsCountRes.data)} */}
            </>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take the Next Step?
          </h2>
          <p className="text-base sm:text-xl text-blue-100 mb-8">
            Join thousands of professionals who found their dream job
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Create Account
            </button>
            <button
              onClick={() => navigate("/jobs")}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ================= REUSABLE COMPONENTS =================

function CompanyCard({ name, jobCount, companyId, logo, onClick }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer text-center border border-gray-100 hover:border-blue-200 group"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
        {logo ? (
          <img src={logo} alt={name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="text-blue-600 font-bold text-lg">
            {name?.charAt(0).toUpperCase() || 'C'}
          </span>
        )}
      </div>
      <p className="font-medium text-gray-800 text-sm truncate" title={name}>
        {name || 'Company'}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {jobCount || 0} {jobCount === 1 ? 'job' : 'jobs'}
      </p>
    </div>
  );
}

function ExperienceCard({ category, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all group"
    >
      <p className="text-3xl font-bold text-blue-600 mb-2">{count.toLocaleString()}</p>
      <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{category}</p>
      <p className="text-sm text-gray-400 mt-2">jobs available</p>
    </button>
  );
}

function SkillCard({ skill, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
    >
      <p className="font-semibold text-gray-800 group-hover:text-blue-600 mb-1">{skill}</p>
      <p className="text-sm text-gray-500">{count.toLocaleString()} jobs</p>
    </button>
  );
}

function FeaturedJobCard({ job, onApply, formatSalary, getDaysAgo, isAuthenticated }) {
  const handleApply = (e) => {
    e.stopPropagation();
    onApply(job._id);
  };

  const handleSaveJob = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onApply(job._id)}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>
        <button
          onClick={handleSaveJob}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <VscHeart className="text-xl" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
        <span className="flex items-center gap-1">
          <VscOrganization className="text-lg" />
          {getCompanyDisplayName(job, isAuthenticated)}
        </span>
        <span className="flex items-center gap-1">
          <HiOutlineLocationMarker className="text-lg" />
          {job.jobLocation || 'Location'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
          {job.empType || 'Full-time'}
        </span>
        <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
          {job.experience || 'Mid-Level'}
        </span>
        {job.salary && (
          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
            <HiOutlineCurrencyRupee className="inline mr-1" />
            {formatSalary(job.salary)}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <BiTimeFive />
          Posted {getDaysAgo(job.createdAt)} days ago
        </span>
        <button
          onClick={handleApply}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
        >
          {isAuthenticated ? "View / Apply" : "Login to Apply"}
        </button>
      </div>
    </div>
  );
}

function ResourceCard({ icon: Icon, title, description, onClick }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-xl transition-all group cursor-pointer" onClick={onClick}>
      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="text-blue-600 text-2xl" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        Read More →
      </button>
    </div>
  );
}

function StatBox({ label, value }) {
  const safeValue = typeof value === "number" ? value : 0;

  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600 mb-2">
        {safeValue.toLocaleString()}+
      </div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}

// ================= SKELETONS =================

function JobSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-3"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function CompanySkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl animate-pulse text-center">
      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
      <div className="h-4 w-20 bg-gray-200 mx-auto mb-2"></div>
      <div className="h-3 w-12 bg-gray-200 mx-auto"></div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="h-8 w-12 bg-gray-200 mb-2"></div>
      <div className="h-5 w-20 bg-gray-200 mb-1"></div>
      <div className="h-4 w-16 bg-gray-200"></div>
    </div>
  );
}

function SkillSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl animate-pulse">
      <div className="h-5 w-24 bg-gray-200 mb-2"></div>
      <div className="h-4 w-16 bg-gray-200"></div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="h-10 w-24 bg-gray-200 mx-auto mb-3"></div>
      <div className="h-5 w-28 bg-gray-200 mx-auto"></div>
    </div>
  );
}
