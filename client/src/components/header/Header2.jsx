import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
import ConfirmLogoutModal from "../dashboard/ConfirmLogoutModal";
import { getDashboardHome, getProfilePath, getSettingsPath } from "../dashboard/dashboardNavigation";
import useLogout from "../../hooks/useLogout";
import UserAvatar from "../ui/UserAvatar";
import logo from "../../assets/JewelCancy_logo.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Find Jobs" },
  { to: "/register?role=recruiter", label: "Hire Talent" },
  { to: "/#services", label: "Services", hash: "#services" },
  { to: "/register?role=recruiter", label: "For Employers", activePath: "/recruiters" },
  { to: "/register", label: "For Candidates", activePath: "/candidates" },
  { to: "/about", label: "About Us" },
];

const publicLinkClass = (active) =>
  [
    "relative px-2 py-2 text-sm font-semibold transition",
    active ? "text-[#5d0f51]" : "text-[#4a3444] hover:text-[#5d0f51]",
    active
      ? "after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#5d0f51]"
      : "",
  ].join(" ");

export default function Header2() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { logout, isLoggingOut } = useLogout();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const requestLogout = () => {
    setProfileMenuOpen(false);
    setMenuOpen(false);
    setLogoutOpen(true);
  };

  const username = user?.username || user?.fullName || user?.email?.split("@")[0] || "User";
  const userNavLinks = user
    ? [
        { to: getDashboardHome(user.role), label: "Dashboard", icon: LayoutDashboard },
        { to: getProfilePath(user.role), label: "Profile", icon: UserRound },
        { to: getSettingsPath(user.role), label: "Settings", icon: Settings },
      ]
    : [];
  const isAboutPage = location.pathname === "/about";
  const publicCta = isAboutPage
    ? { to: "/register?role=recruiter", label: "Post a Job" }
    : { to: "/register", label: "Get Started" };

  const isActive = (link) => {
    if (link.hash) return location.pathname === "/" && location.hash === link.hash;
    if (link.activePath) return location.pathname === link.activePath;
    if (link.to === "/") return location.pathname === "/" && !location.hash;
    return location.pathname === link.to.split("?")[0];
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-200 ${
        scrolled
          ? "border-[#ead8e3] bg-white/95 shadow-[0_12px_30px_rgba(84,19,70,0.08)] backdrop-blur"
          : "border-[#f4e3ed] bg-white"
      }`}
    >
      <nav className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Jewelcancy home">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#ead4e3] bg-[#fff8f4]">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="font-serif text-2xl font-bold text-[#2b1b28]">Jewelcancy</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={`${link.label}-${link.to}`} to={link.to} className={publicLinkClass(isActive(link))}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user && (
              <div className="rounded-lg border border-[#ead8e3] bg-white">
                <NotificationBell />
              </div>
            )}

            {user ? (
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-lg border border-[#ead8e3] bg-white px-2.5 py-2 transition hover:bg-[#fff7fb]"
                >
                  <UserAvatar user={user} className="h-8 w-8 text-sm" />
                  <span className="hidden max-w-32 truncate text-sm font-semibold text-[#3a2634] lg:block">
                    {username}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div
                    className="absolute mt-2 w-[min(16rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-[#ead8e3] bg-white shadow-xl"
                    style={{ insetInlineEnd: 0 }}
                  >
                    <div className="bg-[#5d0f51] p-4 text-white">
                      <p className="truncate font-semibold">{username}</p>
                      <p className="truncate text-sm text-[#f6d9ea]">{user.email}</p>
                    </div>
                    <div className="p-2">
                      {userNavLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#4a3444] transition hover:bg-[#fff7fb]"
                        >
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={requestLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                {!isAboutPage && (
                  <Link
                    to="/login"
                    className="rounded-lg border border-[#d9bdcf] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a183f] transition hover:bg-[#fbf1f7]"
                  >
                    Login
                  </Link>
                )}
                <Link
                  to={publicCta.to}
                  className="rounded-lg bg-[#5d0f51] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(93,15,81,0.18)] transition hover:bg-[#46103e]"
                >
                  {publicCta.label}
                </Link>
              </div>
            )}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ead8e3] bg-white text-[#3a2634] lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile navigation"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          aria-hidden={!menuOpen}
          className={`lg:hidden fixed inset-x-0 top-[4.35rem] bottom-0 z-50 bg-[#2d1028]/95 backdrop-blur-sm transition-all duration-300 ${
            menuOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
          }`}
        >
          <div className="h-full overflow-y-auto px-4 py-5 pb-20">
            {user && (
              <div className="mb-5 rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="truncate font-semibold text-white">{username}</p>
                <p className="truncate text-sm text-[#f6d9ea]">{user.email}</p>
              </div>
            )}

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.to}`}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    isActive(link) ? "bg-white text-[#5d0f51]" : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="mt-6 space-y-1 border-t border-white/20 pt-4">
                {userNavLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-white transition hover:bg-white/10"
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={requestLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-200 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className={`mt-6 grid gap-3 ${isAboutPage ? "" : "sm:grid-cols-2"}`}>
                {!isAboutPage && (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-white/40 px-4 py-3 text-center font-semibold text-white"
                  >
                    Login
                  </Link>
                )}
                <Link
                  to={publicCta.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-[#5d0f51]"
                >
                  {publicCta.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ConfirmLogoutModal
        isOpen={logoutOpen}
        isLoggingOut={isLoggingOut}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
      />
    </header>
  );
}
