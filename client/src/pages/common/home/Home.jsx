import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Compass,
  Database,
  Gem,
  Globe2,
  Hammer,
  LayoutDashboard,
  Monitor,
  PenTool,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { companyApi, dashboardApi } from "../../../api/api";
import heroImage from "../../../assets/home-hero-jewelry-consultation.png";
import ctaBanner from "../../../assets/home-cta-jewelry-banner.png";

const FALLBACK_STATS = {
  jobs: 1250,
  companies: 350,
  candidates: 5000,
  recruiters: 210,
};

const FALLBACK_COMPANIES = [
  { _id: "1", name: "Kalanjali Jewels", location: "Mumbai", jobCount: 24, mark: "KJ" },
  { _id: "2", name: "Shubh Gems Pvt. Ltd.", location: "Jaipur", jobCount: 19, mark: "SG" },
  { _id: "3", name: "Ornate Retail", location: "Delhi", jobCount: 16, mark: "O" },
  { _id: "4", name: "Sparkle Studio", location: "Bengaluru", jobCount: 12, mark: "S" },
  { _id: "5", name: "Lustre Exports", location: "Surat", jobCount: 21, mark: "LE" },
];

const trustedBusinesses = [
  { label: "Manufacturers", icon: Building2 },
  { label: "Export Houses", icon: Globe2 },
  { label: "Retail Chains", icon: Store },
  { label: "Designer Studios", icon: Gem },
  { label: "Gemstone Dealers", icon: ShieldCheck },
  { label: "E-commerce Brands", icon: ShoppingBag },
];

const services = [
  {
    title: "Job Placement",
    description: "Connect with the right talent for permanent and long-term roles.",
    icon: UserRound,
  },
  {
    title: "Bulk Hiring",
    description: "Scale your team quickly with our streamlined bulk hiring solutions.",
    icon: Users,
  },
  {
    title: "Candidate Screening",
    description: "We evaluate skills, experience, and cultural fit for quality shortlisting.",
    icon: ClipboardCheck,
  },
  {
    title: "Interview Scheduling",
    description: "Coordinate interviews to save your time and streamline the process.",
    icon: CalendarDays,
  },
  {
    title: "Employer Branding",
    description: "Showcase your company and attract top jewelry industry talent.",
    icon: Star,
  },
  {
    title: "Career Guidance",
    description: "Helping candidates grow with scope advice and role recommendations.",
    icon: Compass,
  },
];

const roles = [
  { title: "Jewelry CAD", icon: Monitor },
  { title: "Goldsmith", icon: Hammer },
  { title: "Stone Setter", icon: Gem },
  { title: "QC Executive", icon: ShieldCheck },
  { title: "Sales Consultant", icon: UserRound },
  { title: "Store Manager", icon: Store },
  { title: "Visual Merchandiser", icon: PenTool },
  { title: "Operations Coordinator", icon: Settings },
];

const benefits = [
  {
    title: "Faster Hiring",
    description: "Reduce time-to-hire with smart matching and streamlined workflows.",
    icon: Award,
  },
  {
    title: "Verified Talent Pool",
    description: "Access pre-screened and industry-verified candidates across India.",
    icon: BadgeCheck,
  },
  {
    title: "Industry Insights",
    description: "Stay updated with salary trends, hiring insights, and market reports.",
    icon: Database,
  },
  {
    title: "Recruiter Dashboard",
    description: "Manage jobs, applications, and hiring pipelines from one dashboard.",
    icon: LayoutDashboard,
  },
];

const workflow = [
  { label: "Register", text: "Create your account as a candidate or employer.", icon: UserRound },
  { label: "Post or Search", text: "Post jobs or search roles that match your needs.", icon: Search },
  { label: "Shortlist", text: "We shortlist the best profiles for you.", icon: Users },
  { label: "Interview", text: "Schedule interviews and evaluate with ease.", icon: CalendarDays },
  { label: "Hire", text: "Move the right hire and build a stronger team.", icon: CircleCheck },
];

const stories = [
  {
    quote: "Jewelcancy helped us hire skilled CAD designers within days. The quality of candidates is excellent.",
    name: "Rahul Mehta",
    role: "HR Manager",
    company: "Kalanjali Jewels",
    avatar: "RM",
  },
  {
    quote: "We reduced our time-to-hire by 60% using Jewelcancy. Their screening process is top-notch.",
    name: "Pooja Shah",
    role: "HR Head",
    company: "Shubh Gems Pvt. Ltd.",
    avatar: "PS",
  },
  {
    quote: "As a job seeker, I love how easy it is to find relevant roles in the jewelry industry.",
    name: "Neha Verma",
    role: "CAD Designer",
    company: "Mumbai",
    avatar: "NV",
  },
];

const resources = [
  {
    title: "How to Hire Skilled Jewelry Talent",
    description: "Best practices to attract and hire the right talent for your jewelry business.",
    image: heroImage,
  },
  {
    title: "Top Careers in the Jewelry Industry",
    description: "Explore in-demand roles and career growth opportunities in jewelry.",
    image: ctaBanner,
  },
  {
    title: "Interview Tips for Showroom Roles",
    description: "Essential tips to hire confident and customer-facing retail professionals.",
    image: heroImage,
  },
];

const normalizeCompanyName = (name) => {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
};

const getNumber = (data, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((source, part) => source?.[part], data);
    if (typeof value === "number") return value;
  }

  return typeof data === "number" ? data : 0;
};

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [topCompanies, setTopCompanies] = useState(FALLBACK_COMPANIES);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [filters, setFilters] = useState({
    role: "",
    city: "",
    experience: "",
    type: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        const [
          jobsCountRes,
          companiesCountRes,
          candidatesCountRes,
          recruitersCountRes,
          topCompaniesRes,
        ] = await Promise.all([
          dashboardApi.get("/jobs/count").catch(() => null),
          dashboardApi.get("/companies/count").catch(() => null),
          dashboardApi.get("/candidates/count").catch(() => null),
          dashboardApi.get("/recruiters/count").catch(() => null),
          companyApi.get("/top?limit=5").catch(() => null),
        ]);

        if (!isMounted) return;

        const nextStats = {
          jobs:
            getNumber(jobsCountRes?.data, ["jobsCount", "data.jobsCount", "count"]) ||
            FALLBACK_STATS.jobs,
          companies:
            getNumber(companiesCountRes?.data, ["companiesCount", "data.companiesCount", "count"]) ||
            FALLBACK_STATS.companies,
          candidates:
            getNumber(candidatesCountRes?.data, ["candidatesCount", "data.candidatesCount", "count"]) ||
            FALLBACK_STATS.candidates,
          recruiters:
            getNumber(recruitersCountRes?.data, ["recruitersCount", "data.recruitersCount", "count"]) ||
            FALLBACK_STATS.recruiters,
        };

        setStats(nextStats);

        const companyData = Array.isArray(topCompaniesRes?.data?.data)
          ? topCompaniesRes.data.data
          : Array.isArray(topCompaniesRes?.data)
            ? topCompaniesRes.data
            : [];

        const companies = companyData
          .map((company, index) => {
            const name = normalizeCompanyName(company.name || company.companyName);
            if (!name) return null;

            return {
              _id: company._id || company.id || `${name}-${index}`,
              name,
              location: company.location || company.city || "India",
              logo: company.logo,
              jobCount: company.jobCount || company.jobs || 0,
              mark: name
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase(),
            };
          })
          .filter(Boolean)
          .slice(0, 5);

        setTopCompanies(companies.length > 0 ? companies : FALLBACK_COMPANIES);
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const popularSearches = useMemo(
    () => ["CAD Designer", "Sales Executive", "Goldsmith", "QC Executive"],
    []
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSearch = () => {
    const query = new URLSearchParams();

    if (filters.role) query.set("search", filters.role);
    if (filters.city) query.set("location", filters.city);
    if (filters.experience) query.set("experience", filters.experience);
    if (filters.type) query.set("companyType", filters.type);

    navigate(`/jobs${query.toString() ? `?${query.toString()}` : ""}`);
  };

  const handleCompanyClick = (company) => {
    const id = company._id || company.id;
    const validId = typeof id === "string" && (/^[0-9a-fA-F]{24}$/.test(id) || /^\d+$/.test(id));

    if (validId) {
      navigate(`/company/${id}`);
      return;
    }

    navigate(`/companies?search=${encodeURIComponent(company.name)}`);
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-[#251923]">
      <section className="relative overflow-hidden border-b border-[#f2dfeb] bg-[#fff8f4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-8 md:grid-cols-[0.95fr_1.05fr] md:px-6 lg:px-8 lg:pb-16 lg:pt-12">
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#edd5e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#6e185d]">
              <Gem className="h-4 w-4" />
              Specialized hiring solutions for jewelry businesses
            </p>

            <h1 className="max-w-xl font-serif text-4xl font-bold leading-tight text-[#21151f] sm:text-5xl lg:text-6xl">
              Smart Hiring & Career Growth for the Jewelry World
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#67525f] sm:text-base">
              From artisans and designers to merchandisers and showroom staff,
              Jewelcancy helps candidates and employers connect through a focused,
              industry-specific platform.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5d0f51] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(93,15,81,0.22)] transition hover:bg-[#46103e]"
              >
                Explore Jobs
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="inline-flex items-center justify-center rounded-lg border border-[#7e4a71] bg-white px-6 py-3 text-sm font-semibold text-[#4a183f] transition hover:bg-[#fbf1f7]"
              >
                Book Hiring Support
              </button>
            </div>

            <div className="mt-8 rounded-lg border border-[#f0dde8] bg-white p-4 shadow-[0_18px_45px_rgba(84,19,70,0.08)]">
              <div className="grid gap-3 md:grid-cols-3">
                <SearchSelect
                  label="Role / Job Title"
                  value={filters.role}
                  onChange={(value) => updateFilter("role", value)}
                  options={["CAD Designer", "Goldsmith", "Sales Consultant", "Store Manager"]}
                  placeholder="e.g. CAD Designer"
                />
                <SearchSelect
                  label="City"
                  value={filters.city}
                  onChange={(value) => updateFilter("city", value)}
                  options={["Mumbai", "Jaipur", "Surat", "Delhi", "Bengaluru"]}
                  placeholder="e.g. Mumbai"
                />
                <SearchSelect
                  label="Experience"
                  value={filters.experience}
                  onChange={(value) => updateFilter("experience", value)}
                  options={["Fresher", "1-3 Years", "3-5 Years", "5+ Years"]}
                  placeholder="Any Experience"
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <SearchSelect
                  label="Company Type"
                  value={filters.type}
                  onChange={(value) => updateFilter("type", value)}
                  options={["Retail Chain", "Export House", "Designer Studio", "Manufacturer"]}
                  placeholder="All Types"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="mt-auto inline-flex h-[50px] items-center justify-center gap-2 rounded-lg bg-[#7a0e67] px-6 text-sm font-semibold text-white transition hover:bg-[#5d0f51]"
                >
                  <Search className="h-4 w-4" />
                  Search Jobs
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#7d6575]">
                <span className="font-semibold text-[#4a183f]">Popular Searches:</span>
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => navigate(`/jobs?search=${encodeURIComponent(item)}`)}
                    className="transition hover:text-[#5d0f51]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <div className="overflow-hidden rounded-lg border border-[#f0dde8] bg-white shadow-[0_18px_45px_rgba(84,19,70,0.08)]">
              <img
                src={heroImage}
                alt="Jewelry professionals reviewing hiring details"
                className="h-64 w-full object-cover"
              />
              <div className="space-y-4 bg-[#fff7fb] p-4">
                <div className="rounded-lg border border-[#ead8e3] bg-white p-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#5b4453]">Welcome back, Adnan!</p>
                      <p className="text-[11px] text-[#9b7d91]">Employer Dashboard</p>
                    </div>
                    <CircleCheck className="h-4 w-4 text-[#7a0e67]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Metric value="24" label="+8 this week" />
                    <Metric value="312" label="+12 applicants" />
                  </div>
                </div>

                <div className="rounded-lg border border-[#ead8e3] bg-white p-4">
                  <p className="mb-4 text-xs font-bold text-[#3a2634]">Top Placement Roles</p>
                  <div className="flex items-center gap-5">
                    <div
                      className="h-20 w-20 shrink-0 rounded-full"
                      style={{
                        background:
                          "conic-gradient(#5d0f51 0 32%, #8c4b80 32% 57%, #d5a6c7 57% 77%, #f0d7e5 77% 100%)",
                      }}
                    >
                      <div className="m-4 h-12 w-12 rounded-full bg-white" />
                    </div>
                    <div className="space-y-2 text-[11px] text-[#6b5664]">
                      {["Design & CAD", "Sales & Retail", "Production", "Quality Control"].map((item, index) => (
                        <p key={item} className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: ["#5d0f51", "#8c4b80", "#d5a6c7", "#f0d7e5"][index] }}
                          />
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#ead8e3] bg-white p-4">
                  <p className="mb-4 text-xs font-bold text-[#3a2634]">Recent Applications</p>
                  <div className="space-y-3">
                    {["Neha Verma", "Arjun Mehta", "Priya Jain"].map((name, index) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fbedf5] text-[11px] font-bold text-[#6e185d]">
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#3a2634]">{name}</p>
                          <p className="truncate text-[10px] text-[#9b7d91]">
                            {index === 0 ? "CAD Designer" : index === 1 ? "Store Executive" : "Polisher"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[#ead8e3] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#74115f] text-white">
                      <Gem className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#3a2634]">Senior CAD Designer</p>
                      <p className="text-xs text-[#8a7182]">Mumbai - 3-5 yrs - Full Time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden min-h-[520px] md:block">
            <div className="absolute inset-0 rounded-lg bg-[#f7e8ef]" />
            <img
              src={heroImage}
              alt="Jewelry professionals reviewing hiring details"
              className="absolute inset-0 h-full w-full rounded-lg object-cover"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#fff8f4]/70 via-transparent to-transparent" />

            <div className="absolute left-5 top-8 w-[220px] rounded-lg border border-white/80 bg-white/92 p-5 shadow-[0_18px_40px_rgba(51,22,43,0.16)] backdrop-blur">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#5b4453]">Welcome back, Adnan!</p>
                  <p className="text-[11px] text-[#9b7d91]">Employer Dashboard</p>
                </div>
                <CircleCheck className="h-4 w-4 text-[#7a0e67]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Metric value="24" label="+8 this week" />
                <Metric value="312" label="+12 applicants" />
              </div>
            </div>

            <div className="absolute bottom-36 left-4 w-[260px] rounded-lg border border-white/80 bg-white/92 p-5 shadow-[0_18px_40px_rgba(51,22,43,0.16)] backdrop-blur">
              <p className="mb-4 text-xs font-bold text-[#3a2634]">Top Placement Roles</p>
              <div className="flex items-center gap-5">
                <div
                  className="h-24 w-24 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#5d0f51 0 32%, #8c4b80 32% 57%, #d5a6c7 57% 77%, #f0d7e5 77% 100%)",
                  }}
                >
                  <div className="m-5 h-14 w-14 rounded-full bg-white" />
                </div>
                <div className="space-y-2 text-[11px] text-[#6b5664]">
                  {["Design & CAD", "Sales & Retail", "Production", "Quality Control"].map((item, index) => (
                    <p key={item} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: ["#5d0f51", "#8c4b80", "#d5a6c7", "#f0d7e5"][index] }}
                      />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-5 top-56 w-[220px] rounded-lg border border-white/80 bg-white/92 p-5 shadow-[0_18px_40px_rgba(51,22,43,0.16)] backdrop-blur">
              <p className="mb-4 text-xs font-bold text-[#3a2634]">Recent Applications</p>
              <div className="space-y-3">
                {["Neha Verma", "Arjun Mehta", "Priya Jain"].map((name, index) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fbedf5] text-[11px] font-bold text-[#6e185d]">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#3a2634]">{name}</p>
                      <p className="truncate text-[10px] text-[#9b7d91]">
                        {index === 0 ? "CAD Designer" : index === 1 ? "Store Executive" : "Polisher"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate("/recruiter/candidates-list")}
                className="mt-4 w-full rounded-lg border border-[#ecd8e5] py-2 text-[11px] font-semibold text-[#5d0f51]"
              >
                View All Applications
              </button>
            </div>

            <div className="absolute bottom-8 left-28 right-16 rounded-lg border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_rgba(51,22,43,0.16)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#74115f] text-white">
                    <Gem className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#3a2634]">Senior CAD Designer</p>
                    <p className="text-xs text-[#8a7182]">Mumbai - 3-5 yrs - Full Time</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#fff0f8] px-3 py-1 text-xs font-bold text-[#8b1a72]">
                  Hot Job
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 md:px-6 lg:px-8">
        <SectionHeading title="Trusted by Leading Jewelry Businesses" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {trustedBusinesses.map((item) => (
            <IconTile key={item.label} icon={item.icon} label={item.label} />
          ))}
        </div>
      </section>

      <section id="services" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <SectionHeading
            title="Our Specialized Services"
            subtitle="End-to-end hiring solutions tailored for the jewelry industry."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <FeatureCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <SectionHeading title="Opportunities Across Every Jewelry Role" />
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#f0dde8] bg-white sm:grid-cols-4">
          {roles.map((role) => (
            <button
              key={role.title}
              type="button"
              onClick={() => navigate(`/jobs?search=${encodeURIComponent(role.title)}`)}
              className="flex min-h-[120px] flex-col items-center justify-center gap-3 border-b border-r border-[#f0dde8] p-4 text-center transition hover:bg-[#fff7fb]"
            >
              <role.icon className="h-8 w-8 text-[#815074]" />
              <span className="text-sm font-semibold text-[#3a2634]">{role.title}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="rounded-full bg-[#5d0f51] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#46103e]"
          >
            View All Jobs
          </button>
        </div>
      </section>

      <section id="companies" className="bg-[#fff6f2] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <SectionHeading title="Top Companies Hiring on Jewelcancy" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(loadingCompanies ? FALLBACK_COMPANIES : topCompanies).map((company) => (
              <CompanyCard key={company._id || company.name} company={company} onClick={() => handleCompanyClick(company)} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <SectionHeading title="Platform Benefits" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <FeatureCard key={benefit.title} {...benefit} compact />
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <SectionHeading title="How Jewelcancy Works" />
          <div className="grid gap-4 md:grid-cols-5">
            {workflow.map((step, index) => (
              <ProcessStep key={step.label} index={index + 1} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <SectionHeading title="Success Stories from Our Community" />
        <div className="grid gap-5 md:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.name} story={story} />
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <SectionHeading title="Resources & Insights" />
          <div className="grid gap-5 md:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.title} resource={resource} />
            ))}
          </div>
          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="rounded-lg border border-[#7e4a71] bg-white px-7 py-2.5 text-sm font-semibold text-[#4a183f] transition hover:bg-[#fbf1f7]"
            >
              View All Articles
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-lg bg-[#4c0e42] bg-cover bg-left p-6 shadow-[0_22px_55px_rgba(76,14,66,0.24)] md:p-8"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(76,14,66,0.28), rgba(76,14,66,0.92) 46%, rgba(76,14,66,0.97)), url(${ctaBanner})` }}
        >
          <div className="ml-auto max-w-3xl">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
                  Join the network powering jewelry careers
                </h2>
                <p className="mt-3 text-sm text-[#f8ddec]">
                  The right people. The right opportunities. All in one place.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="min-w-[132px] whitespace-nowrap rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#4b123f] transition hover:bg-[#fff6fb]"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/contact")}
                  className="min-w-[132px] whitespace-nowrap rounded-lg border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Talk to Our Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      <h2 className="font-serif text-2xl font-bold text-[#251923] md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm leading-6 text-[#7f6878]">{subtitle}</p>}
    </div>
  );
}

function SearchSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#4b3444]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[50px] w-full rounded-lg border border-[#ead8e3] bg-[#fffdfb] px-3 text-sm text-[#3a2634] outline-none transition focus:border-[#7a0e67] focus:ring-2 focus:ring-[#efd5e8]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ value, label }) {
  return (
    <div>
      <p className="text-2xl font-bold text-[#231522]">{value}</p>
      <p className="text-[10px] text-[#9b7d91]">{label}</p>
    </div>
  );
}

function IconTile({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-transparent p-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#ecd8e4] text-[#7b4b70]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-xs font-semibold text-[#3f2b39]">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, compact = false }) {
  return (
    <div className="rounded-lg border border-[#f0dde8] bg-white p-5 shadow-[0_12px_28px_rgba(84,19,70,0.06)]">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#ead4e3] bg-[#fff7fb] text-[#7a0e67]">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#2b1b28]">{title}</h3>
          <p className={`mt-2 text-sm leading-6 text-[#7d6575] ${compact ? "text-xs" : ""}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#f0dde8] bg-white p-5 text-center shadow-[0_12px_28px_rgba(84,19,70,0.06)] transition hover:-translate-y-1 hover:border-[#d5a6c7] hover:shadow-[0_18px_36px_rgba(84,19,70,0.12)]"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-[#ead4e3] bg-[#fff9ef] font-serif text-xl font-bold text-[#704314]">
        {company.logo ? (
          <img src={company.logo} alt="" className="h-full w-full rounded-lg object-cover" />
        ) : (
          company.mark || company.name.charAt(0)
        )}
      </span>
      <h3 className="mt-4 truncate text-sm font-bold text-[#2b1b28]" title={company.name}>
        {company.name}
      </h3>
      <p className="mt-1 text-xs text-[#8a7182]">{company.location || "India"}</p>
      <p className="mt-3 text-xs font-semibold text-[#6e185d]">{company.jobCount || 0}+ active jobs</p>
      <span className="mt-4 inline-flex rounded-lg border border-[#d9bdcf] px-4 py-2 text-xs font-semibold text-[#4a183f]">
        View Jobs
      </span>
    </button>
  );
}

function ProcessStep({ icon: Icon, index, label, text }) {
  return (
    <div className="relative rounded-lg border border-[#f0dde8] bg-white p-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#6e185d] text-white shadow-[0_14px_30px_rgba(110,24,93,0.2)]">
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-2 inline-flex text-[10px] font-bold text-[#a07694]">0{index}</span>
      <h3 className="mt-2 text-sm font-bold text-[#2b1b28]">{label}</h3>
      <p className="mt-2 text-xs leading-5 text-[#7d6575]">{text}</p>
    </div>
  );
}

function StoryCard({ story }) {
  return (
    <div className="rounded-lg border border-[#f0dde8] bg-white p-6 shadow-[0_12px_28px_rgba(84,19,70,0.06)]">
      <Quote className="h-6 w-6 text-[#d0a5c2]" />
      <p className="mt-4 min-h-[96px] text-sm leading-6 text-[#5f4a59]">{story.quote}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-[#f2e3ec] pt-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#641356] text-xs font-bold text-white">
          {story.avatar}
        </span>
        <div>
          <p className="text-sm font-bold text-[#2b1b28]">{story.name}</p>
          <p className="text-xs text-[#8a7182]">
            {story.role} - {story.company}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ resource }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#f0dde8] bg-white shadow-[0_12px_28px_rgba(84,19,70,0.06)]">
      <img src={resource.image} alt="" className="h-40 w-full object-cover" />
      <div className="p-5">
        <h3 className="text-sm font-bold text-[#2b1b28]">{resource.title}</h3>
        <p className="mt-2 min-h-[48px] text-xs leading-5 text-[#7d6575]">{resource.description}</p>
        <button type="button" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#6e185d]">
          Read More
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
