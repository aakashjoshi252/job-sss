import { Mail, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Header() {
  const isAuthenticated = useSelector(
    (state) => state?.auth?.isAuthenticated || false
  );

  if (isAuthenticated) return null;

  return (
    <header className="border-b border-[#f2dfeb] bg-[#fff7f4] text-[#4d3747]">
      <div className="mx-auto flex min-h-9 w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2 text-xs sm:flex-row md:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-[#7a0e67]" />
          India's Specialized Jewelry Recruitment Platform
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-medium">
          <Link to="/jobs" className="transition hover:text-[#6e185d]">
            Job Seekers
          </Link>
          <Link to="/register?role=recruiter" className="transition hover:text-[#6e185d]">
            Employers
          </Link>
          <a href="tel:+918976542310" className="inline-flex items-center gap-1.5 transition hover:text-[#6e185d]">
            <Phone className="h-3.5 w-3.5" />
            +91 89765 42310
          </a>
          <a href="mailto:support@jewelcancy.com" className="inline-flex items-center gap-1.5 transition hover:text-[#6e185d]">
            <Mail className="h-3.5 w-3.5" />
            support@jewelcancy.com
          </a>
        </div>
      </div>
    </header>
  );
}
