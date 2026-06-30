import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Gem,
  Handshake,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { FaLinkedinIn, FaQuoteLeft, FaStar } from "react-icons/fa";
import heroImage from "../../../assets/home-hero-jewelry-consultation.png";
import ctaImage from "../../../assets/home-cta-jewelry-banner.png";
import showroomImage from "../../../assets/about-showroom.png";
import rohitImage from "../../../assets/about-team-rohit.png";
import priyaImage from "../../../assets/about-team-priya.png";
import amitImage from "../../../assets/about-team-amit.png";
import nehaImage from "../../../assets/about-team-neha.png";

const heroStats = [
  { value: "10K+", label: "Active Jewelry Professionals", icon: Users },
  { value: "2K+", label: "Trusted Employers", icon: Building2 },
  { value: "25+", label: "Cities Across India", icon: MapPin },
  { value: "98%", label: "Candidate Satisfaction", icon: Award },
];

const overviewStats = [
  { value: "10K+", label: "Active Jobs", icon: Briefcase },
  { value: "2K+", label: "Hiring Companies", icon: Building2 },
  { value: "15K+", label: "Candidates Placed", icon: UserCheck },
  { value: "98%", label: "Satisfaction Rate", icon: BadgeCheck },
];

const missionCards = [
  {
    title: "Our Mission",
    icon: Target,
    description:
      "To empower jewelry professionals by connecting them with the right opportunities and helping businesses build high-performing teams.",
  },
  {
    title: "Our Vision",
    icon: Sparkles,
    description:
      "To be the most trusted and preferred jewelry recruitment platform in India and globally, known for quality, trust, and impact.",
  },
  {
    title: "Our Values",
    icon: Gem,
    points: ["Trust & Transparency", "Industry Focus", "Speed & Efficiency", "Quality Hiring", "Career Growth"],
  },
];

const standOutItems = [
  {
    title: "Industry Expertise",
    description: "Deep understanding of the jewelry sector and its unique hiring needs.",
    icon: Gem,
  },
  {
    title: "Verified Employers",
    description: "All companies are verified for credibility, authenticity and quality.",
    icon: ShieldCheck,
  },
  {
    title: "Smart Matching",
    description: "Advanced matching technology connects the right talent with the right roles.",
    icon: TrendingUp,
  },
  {
    title: "Dedicated Support",
    description: "Personalized assistance for job seekers and employers at every step.",
    icon: Handshake,
  },
  {
    title: "Faster Hiring",
    description: "Streamlined process to help companies hire the best talent faster.",
    icon: Clock3,
  },
];

const journey = [
  {
    year: "2020",
    title: "The Beginning",
    description: "Jewelcancy was founded with a vision to transform jewelry recruitment in India.",
    icon: Target,
  },
  {
    year: "2021",
    title: "Growing Network",
    description: "Expanded recruiter partnerships and onboarded thousands of jewelry professionals.",
    icon: Users,
  },
  {
    year: "2022",
    title: "Talent Expansion",
    description: "Strengthened our database and helped businesses across major jewelry hubs.",
    icon: TrendingUp,
  },
  {
    year: "2023 & Beyond",
    title: "Nationwide Impact",
    description: "Continuing to empower careers and build the future of the jewelry industry.",
    icon: Trophy,
  },
];

const team = [
  {
    name: "Rohit Mehta",
    role: "Co-Founder & CEO",
    description: "Industry expert with 12+ years in HR and jewelry recruitment.",
    image: rohitImage,
  },
  {
    name: "Priya Sharma",
    role: "Co-Founder & COO",
    description: "Specializes in talent strategy and operational excellence.",
    image: priyaImage,
  },
  {
    name: "Amit Patel",
    role: "Head of Partnerships",
    description: "Builds strategic relationships with leading jewelry brands.",
    image: amitImage,
  },
  {
    name: "Neha Desai",
    role: "Head of Candidate Success",
    description: "Ensures exceptional experiences for candidates at every step.",
    image: nehaImage,
  },
];

const helpCards = [
  {
    title: "For Job Seekers",
    icon: UserCheck,
    button: "Find Your Dream Job",
    path: "/jobs",
    items: [
      "Access to top jewelry jobs across India",
      "Personalized job recommendations",
      "Resume visibility to trusted employers",
      "Career guidance and support",
    ],
  },
  {
    title: "For Recruiters & Employers",
    icon: Building2,
    button: "Hire the Right Talent",
    path: "/register?role=recruiter",
    items: [
      "Post jobs and reach relevant talent",
      "Verified candidate database",
      "Faster shortlisting and hiring",
      "Dedicated account support",
    ],
  },
];

const testimonials = [
  {
    quote:
      "Jewelcancy helped me find a role that perfectly matches my skills and career goals in the jewelry industry.",
    name: "Anjali Verma",
    role: "Jewelry Designer",
    image: nehaImage,
  },
  {
    quote:
      "The quality of candidates on Jewelcancy is excellent. We hired skilled professionals within days.",
    name: "Karan Shah",
    role: "HR Manager, Shah Diamond Co.",
    image: rohitImage,
  },
  {
    quote:
      "A trusted platform for the jewelry community. Their support team is proactive and professional.",
    name: "Mehul Jain",
    role: "Director, Jain Jewels",
    image: amitImage,
  },
];

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#9c5c8d]">{eyebrow}</p>}
      <h2 className="font-serif text-3xl font-bold text-[#2f2430] md:text-4xl">{title}</h2>
      <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-[#7a0e67]" />
    </div>
  );
}

function IconBadge({ icon: Icon, className = "" }) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[#ebd7e5] bg-[#fff8fb] text-[#8b3c7b] ${className}`}
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fffaf7] text-[#362734]">
      <section className="relative overflow-hidden border-b border-[#f2e3ed] bg-gradient-to-br from-[#fffaf7] via-white to-[#f7edf4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(122,14,103,0.08),transparent_30%),radial-gradient(circle_at_92%_8%,rgba(194,142,88,0.12),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ecd8e5] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7a0e67]">
              <Sparkles className="h-4 w-4" />
              About Jewelcancy
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-[#211a22] sm:text-5xl lg:text-6xl">
              About Jewelcancy
            </h1>
            <p className="mt-5 max-w-xl font-serif text-2xl font-semibold leading-snug text-[#3f303d] sm:text-3xl">
              Connecting jewelry talent with trusted opportunities.
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#5e4b5a]">
              Jewelcancy is India's specialized platform for jewelry recruitment and placement. We connect skilled
              professionals with leading jewelry brands, manufacturers, and retailers to build meaningful careers and
              stronger businesses.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5d0f51] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(93,15,81,0.2)] transition hover:bg-[#45103e]"
              >
                Browse Jobs
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/register?role=recruiter")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cba8bf] bg-white px-6 py-3 text-sm font-bold text-[#5d0f51] transition hover:bg-[#fff2f8]"
              >
                Hire Talent
              </button>
            </div>
          </div>

          <div className="relative min-h-[31rem]">
            <img
              src={heroImage}
              alt="Jewelry professionals reviewing hiring opportunities"
              className="ml-auto h-[24rem] w-full max-w-[39rem] rounded-lg object-cover shadow-[0_22px_70px_rgba(82,39,68,0.16)] lg:h-[29rem]"
            />
            <img
              src={ctaImage}
              alt="Diamond ring detail"
              className="absolute left-0 top-[45%] hidden h-32 w-44 rounded-lg border-4 border-white object-cover shadow-xl sm:block"
            />
            <img
              src={showroomImage}
              alt="Luxury jewelry showroom"
              className="absolute bottom-6 left-[20%] hidden h-36 w-36 rounded-lg border-4 border-white object-cover shadow-xl md:block"
            />
            <div className="absolute bottom-0 right-0 w-[min(22rem,92vw)] rounded-lg border border-[#ead5e3] bg-white/95 p-6 shadow-[0_20px_50px_rgba(82,39,68,0.16)] backdrop-blur">
              <div className="grid gap-4">
                {heroStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff3fa] text-[#8b3c7b]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xl font-bold text-[#2b1f2a]">{item.value}</p>
                        <p className="text-sm text-[#675363]">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
            <img
              src={showroomImage}
              alt="Jewelcancy jewelry showroom"
              className="h-[22rem] w-full rounded-lg object-cover shadow-[0_16px_40px_rgba(82,39,68,0.12)]"
            />
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#2f2430] md:text-4xl">Who We Are</h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-[#5f4d5b]">
                <p>
                  Jewelcancy is a dedicated jewelry recruitment and placement platform created to bridge the gap
                  between exceptional talent and the right opportunities in the jewelry industry.
                </p>
                <p>
                  We serve a wide spectrum of businesses, including manufacturers, retailers, designers, gemstone
                  companies, wholesalers, exporters, and luxury jewelry brands, helping them find the right talent
                  faster.
                </p>
                <p>
                  From entry-level professionals to senior leadership roles, we empower careers and drive growth for
                  businesses across the jewelry ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-[#f0dfe9] bg-[#fffdfb] p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <IconBadge icon={Icon} className="h-11 w-11" />
                    <div>
                      <p className="text-2xl font-bold text-[#2f2430]">{item.value}</p>
                      <p className="text-sm font-medium text-[#685664]">{item.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf7] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Our Mission, Vision & Values" />
          <div className="grid gap-6 md:grid-cols-3">
            {missionCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-[#eedce7] bg-white p-7 shadow-sm">
                  <IconBadge icon={Icon} />
                  <h3 className="mt-5 font-serif text-2xl font-bold text-[#6d245d]">{card.title}</h3>
                  {card.description ? (
                    <p className="mt-4 text-sm leading-7 text-[#655260]">{card.description}</p>
                  ) : (
                    <ul className="mt-4 space-y-2 text-sm text-[#655260]">
                      {card.points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-[#7a0e67]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Why Jewelcancy Stands Out" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {standOutItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-[#f0dfe9] bg-white p-5 text-center shadow-sm">
                  <IconBadge icon={Icon} className="mx-auto" />
                  <h3 className="mt-4 text-base font-bold text-[#2f2430]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#655260]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf7] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Our Journey" />
          <div className="relative grid gap-6 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-16 hidden h-px bg-[#d9afca] md:block" />
            {journey.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.year} className="relative rounded-lg border border-[#eedce7] bg-white p-6 shadow-sm">
                  <IconBadge icon={Icon} className="mb-8" />
                  <p className="text-sm font-bold text-[#5d0f51]">{item.year}</p>
                  <h3 className="mt-2 font-serif text-xl font-bold text-[#6d245d]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#655260]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Meet Our Team" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <article key={member.name} className="rounded-lg border border-[#eedce7] bg-white p-3 shadow-sm">
                <div className="relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="aspect-[4/3] w-full rounded-md bg-[#f7eef4] object-cover object-top"
                  />
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-[#6f315f] shadow-sm">
                    <FaLinkedinIn className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="px-2 pb-3 pt-4">
                  <h3 className="font-bold text-[#2f2430]">{member.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#6d245d]">{member.role}</p>
                  <p className="mt-2 text-sm leading-6 text-[#655260]">{member.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf7] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="How We Help" />
          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
            {helpCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-[#ead5e3] bg-white p-7 shadow-sm">
                  <div className="flex items-center gap-4">
                    <IconBadge icon={Icon} />
                    <h3 className="font-serif text-2xl font-bold text-[#6d245d]">{card.title}</h3>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-[#5f4d5b]">
                    {card.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7a0e67]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigate(card.path)}
                    className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#5d0f51] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#45103e]"
                  >
                    {card.button}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {index === 0 && <span className="sr-only">Job seeker support</span>}
                </article>
              );
            })}
            <div className="hidden items-center justify-center lg:flex">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ead5e3] bg-white text-[#6d245d] shadow-sm">
                <Users className="h-7 w-7" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="What People Say" />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-[#eedce7] bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-[#d58b23]">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <FaStar key={star} className="h-4 w-4" />
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <FaQuoteLeft className="mt-1 h-5 w-5 shrink-0 text-[#b474a4]" />
                  <p className="text-sm leading-7 text-[#5f4d5b]">{testimonial.quote}</p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover object-top"
                  />
                  <div>
                    <p className="font-bold text-[#2f2430]">{testimonial.name}</p>
                    <p className="text-sm text-[#6e5b68]">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf7] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-[#5d0f51] shadow-[0_22px_54px_rgba(93,15,81,0.18)]">
          <div className="grid items-center lg:grid-cols-[0.95fr_1.4fr_auto]">
            <img src={ctaImage} alt="Diamond jewelry" className="h-44 w-full object-cover lg:h-full" />
            <div className="px-6 py-8 text-white md:px-10">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Let's Build Jewelry Careers Together</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f7d8ea]">
                Join thousands of professionals and companies building the future of the jewelry industry.
              </p>
            </div>
            <div className="flex flex-col gap-3 px-6 pb-8 md:flex-row lg:flex-col lg:px-8 lg:py-8">
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#5d0f51] transition hover:bg-[#fff3fa]"
              >
                Browse Jobs
              </button>
              <button
                type="button"
                onClick={() => navigate("/register?role=recruiter")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/50 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Hire Talent
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
