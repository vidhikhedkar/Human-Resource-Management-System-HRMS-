import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {LayoutDashboard,Users,CalendarCheck,CalendarDays, Wallet, LogOut, Menu, X, Briefcase, Loader2,} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../services/api";

const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    path: "/employees",
    icon: Users,
    adminOnly: true,
  },
  {
    name: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
  },
  {
    name: "Leaves",
    path: "/leaves",
    icon: CalendarDays,
  },
  {
    name: "Payroll",
    path: "/payroll",
    icon: Wallet,
  },
];


const SidebarContent = ({
  user,
  links,
  mobile,
  onClose,
  onLogout,
  loggingOut,
  logoutError,
  reduceMotion,
}) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="mb-8 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            whileHover={reduceMotion ? undefined : { rotate: -6, scale: 1.05 }}
            className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 p-2 shadow-lg shadow-indigo-600/20"
          >
            <Briefcase size={22} className="text-white" />
          </motion.div>

          <h1 className="truncate text-xl font-bold tracking-wide text-white">
            WorkSphere
          </h1>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav
        aria-label="Main navigation"
        className="min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto "
      >
        {links.map(({ name, path, icon: Icon }, index) => (
          <motion.div
            key={path}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.055,
            }}
            className="w-full min-w-0"
          >
            <NavLink
              to={path}
              onClick={() => {
                if (mobile) onClose();
              }}
              className={({ isActive }) =>
                `group relative flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={
                        mobile
                          ? "mobile-nav-indicator"
                          : "desktop-nav-indicator"
                      }
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                      className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-white"
                    />
                  )}

                  <Icon
                    size={19}
                    className="relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />

                  <span className="relative z-10 min-w-0 truncate">{name}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-slate-800 pt-4">
        {user?.name && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-sm font-semibold uppercase text-indigo-300">
              {user.name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>

              <p className="truncate text-xs capitalize text-slate-400">
                {user.role || "Employee"}
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {logoutError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="overflow-hidden"
            >
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">
                {logoutError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>


        <motion.button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          whileTap={reduceMotion || loggingOut ? undefined : { scale: 0.98 }}
          className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 size={19} className="shrink-0 animate-spin" />
          ) : (
            <LogOut size={19} className="shrink-0" />
          )}

          <span className="truncate">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </motion.button>
      </div>
    </div>
  );
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const menuButtonRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const links = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);


  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);


  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setIsMobileMenuOpen(false);
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError(
        error.response?.data?.message || "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };


  const sidebarProps = {
    user,
    links,
    onClose: () => {
      setIsMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    },
    onLogout: logout,
    loggingOut,
    logoutError,
    reduceMotion,
  };


  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-clip bg-slate-50 text-slate-900 md:flex-row">
      <header className="sticky top-0 z-30 flex w-full min-w-0 items-center justify-between bg-slate-900 px-4 py-3.5 text-white shadow-md md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="shrink-0 rounded-lg bg-indigo-600 p-1.5">
            <Briefcase size={18} />
          </div>

          <span className="truncate text-lg font-bold tracking-wide">
            WorkSphere
          </span>
        </div>

        <motion.button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          className="shrink-0 rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Menu size={22} />
        </motion.button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={reduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 32,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden bg-slate-900 p-5 text-white shadow-2xl md:hidden"
          >
            <SidebarContent {...sidebarProps} mobile />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 p-6 text-white md:flex lg:w-72">
        <SidebarContent {...sidebarProps} mobile={false} />
      </aside>

      <main className="min-w-0 w-full flex-1 overflow-x-hidden p-4 sm:p-6 ">
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="mx-auto w-full min-w-0 max-w-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
