import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Users,
  CalendarCheck,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

const features = [
  { icon: Users, label: "Employee Directory" },
  { icon: CalendarCheck, label: "Attendance Tracking" },
  { icon: ShieldCheck, label: "Leave Approvals" },
  { icon: Wallet, label: "Payroll Management" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9@._%+-]/g, "");
    setForm((prev) => ({
      ...prev,
      email: value,
    }));
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/[<>/{}\[\]]/g, "");
    setForm((prev) => ({
      ...prev,
      password: value,
    }));
    if (error) setError("");
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!data.success || !data.user) {
        throw new Error("Invalid login response");
      }
      localStorage.removeItem("token");
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };


  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 25 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      delay,
      ease: "easeOut",
    },
  });


  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-2 bg-slate-50 overflow-x-hidden">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -45 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.75,
          ease: "easeOut",
        }}
        className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-10 sm:p-10 relative overflow-hidden"
      >
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, 35, 0],
                  y: [0, 25, 0],
                  scale: [1, 1.15, 1],
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, -30, 0],
                  y: [0, -35, 0],
                  scale: [1, 1.12, 1],
                }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          {...fadeUp(0.1)}
          className="relative z-10 flex items-center gap-3.5"
        >
          <motion.div
            whileHover={reduceMotion ? {} : { rotate: 8, scale: 1.08 }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
            className="w-11 h-11 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center"
          >
            <Building2 size={24} className="text-white" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">WorkSphere</h1>
            <p className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">
              Human Resource Management
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 max-w-lg my-auto py-8">
          <motion.span
            {...fadeUp(0.2)}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-medium text-indigo-200 mb-6"
          >
            <ShieldCheck size={15} className="text-indigo-400" />
            Smart HR Management Platform
          </motion.span>

          <motion.h2
            {...fadeUp(0.3)}
            className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight"
          >
            Manage your
            <span className="block text-indigo-400 mt-1">
              workforce smarter.
            </span>
          </motion.h2>

          <motion.p
            {...fadeUp(0.45)}
            className="text-slate-400 text-base xl:text-lg mt-5 leading-relaxed"
          >
            One unified workspace to streamline employees, attendance, leave
            approvals, and payroll operations.
          </motion.p>

          <div className="grid grid-cols-2 gap-3.5 mt-10">
            {features.map(({ icon: Icon, label }, index) => (
              <motion.div
                key={label}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.5 + index * 0.12,
                }}
                whileHover={
                  reduceMotion
                    ? {}
                    : {
                        y: -5,
                        scale: 1.02,
                        borderColor: "rgba(129,140,248,0.45)",
                      }
                }
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs cursor-default"
              >
                <motion.div
                  whileHover={reduceMotion ? {} : { rotate: -8, scale: 1.1 }}
                  className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0"
                >
                  <Icon size={18} />
                </motion.div>

                <span className="text-sm font-medium text-slate-200">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          {...fadeUp(0.7)}
          className="relative z-10 text-xs text-slate-500"
        >
          © {new Date().getFullYear()} WorkSphere HRMS. All rights reserved.
        </motion.p>
      </motion.div>

      <div className="flex flex-col items-center justify-center px-4 sm:px-2 py-8 sm:py-12">
        <div className="w-full">
          <motion.div
            {...fadeUp(0.1)}
            className="lg:hidden flex items-center justify-center gap-3 mb-7 sm:mb-9"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center text-white">
              <Building2 size={22} />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                WorkSphere
              </h1>

              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
                HR Management
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 35,
                    scale: 0.97,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.65,
              delay: 0.15,
              ease: "easeOut",
            }}
            className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl p-6 sm:p-9"
          >
            <motion.div {...fadeUp(0.3)} className="mb-6 sm:mb-8">
              <p className="text-indigo-600 text-xs font-bold tracking-wider uppercase mb-1.5">
                Welcome Back
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Sign in
              </h2>

              <p className="text-slate-500 mt-2 text-sm">
                Enter your credentials to access your workspace.
              </p>
            </motion.div>

            <AnimatePresence>
              {location.state?.message && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  role="status"
                  className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl p-3.5 text-sm mb-5 overflow-hidden"
                >
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 shrink-0 mt-0.5"
                  />
                  <span>{location.state.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key={error}
                  initial={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  transition={{ duration: 0.3 }}
                  role="alert"
                  className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200/80 rounded-xl p-3.5 text-sm mb-5 overflow-hidden"
                >
                  <AlertCircle
                    size={18}
                    className="text-red-600 shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <motion.div {...fadeUp(0.4)}>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    maxLength={254}
                    pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)+"
                    title="Please enter a valid email address"
                    className="w-full text-sm sm:text-base border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.5)}>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full text-sm sm:text-base border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileTap={reduceMotion ? {} : { scale: 0.85 }}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showPassword ? "visible" : "hidden"}
                        initial={
                          reduceMotion
                            ? false
                            : {
                                opacity: 0,
                                rotate: -15,
                              }
                        }
                        animate={{
                          opacity: 1,
                          rotate: 0,
                        }}
                        exit={{
                          opacity: 0,
                          rotate: 15,
                        }}
                        transition={{
                          duration: 0.15,
                        }}
                        className="block"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={
                  reduceMotion || loading ? {} : { scale: 1.02, y: -2 }
                }
                whileTap={reduceMotion || loading ? {} : { scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 22,
                }}
                className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:pointer-events-none text-white text-sm sm:text-base font-semibold py-3.5 rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>

                    <motion.span
                      animate={reduceMotion ? {} : { x: [0, 4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              {...fadeUp(0.65)}
              className="mt-6 pt-5 border-t border-slate-100 text-center"
            >
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>

            <p className="text-xs text-slate-400 text-center mt-4">
              Secure access for authorized employees and administrators.
            </p>
          </motion.div>

          <motion.p
            {...fadeUp(0.8)}
            className="text-center text-xs text-slate-400 mt-6"
          >
            WorkSphere — Human Resource Management System
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default Login;
