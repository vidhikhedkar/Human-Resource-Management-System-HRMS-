import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Building2,
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import api from "../services/api";


const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;


const getPasswordChecks = (password) => [
  {
    label: "At least 8 characters",
    valid: password.length >= 8,
  },
  {
    label: "Uppercase letter",
    valid: /[A-Z]/.test(password),
  },
  {
    label: "Lowercase letter",
    valid: /[a-z]/.test(password),
  },
  {
    label: "Number",
    valid: /\d/.test(password),
  },
  {
    label: "Special character",
    valid: /[@#$%&*!_-]/.test(password),
  },
];


const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};



const Register = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = getPasswordChecks(form.password);
  const passwordScore = passwordChecks.filter((check) => check.valid).length;

  const passwordStrength =
    passwordScore <= 2 ? "Weak" : passwordScore <= 4 ? "Medium" : "Strong";

  const getFieldError = (field) => {
    const value = form[field];
    if (field === "name") {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2)
        return "Name must contain at least 2 characters.";
      if (value.trim().length > 60) return "Name cannot exceed 60 characters.";
      if (!nameRegex.test(value.trim())) return "Use letters and spaces only.";
    }
    if (field === "email") {
      if (!value) return "Email address is required.";
      if (!emailRegex.test(value)) return "Enter a valid email address.";
    }

    if (field === "password") {
      if (!value) return "Password is required.";
      if (value.length > 64) return "Password cannot exceed 64 characters.";
      if (passwordScore !== 5) return "Password must meet all requirements.";
    }

    if (field === "confirmPassword") {
      if (!value) return "Please confirm your password.";
      if (value !== form.password) return "Passwords do not match.";
    }

    return "";
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleaned = value;

    if (name === "name") {
      cleaned = value
        .replace(/[^A-Za-z ]/g, "")
        .replace(/ {2,}/g, " ")
        .slice(0, 60);
    }

    if (name === "email") {
      cleaned = value.replace(/[^a-zA-Z0-9@._%+-]/g, "").slice(0, 254);
    }

    if (name === "password" || name === "confirmPassword") {
      cleaned = value.replace(/[<>/{}\[\]]/g, "").slice(0, 64);
    }

    setForm((prev) => ({
      ...prev,
      [name]: cleaned,
    }));

    setError("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fields = ["name", "email", "password", "confirmPassword"];

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const hasError = fields.some((field) => Boolean(getFieldError(field)));
    if (hasError) return;
    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.code === "ERR_NETWORK"
            ? "Unable to connect to the server. Check that your backend is running."
            : "Unable to create account. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };


  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.55,
      delay,
      ease: "easeOut",
    },
  });


  const inputClass = (field) =>
    `w-full rounded-xl border bg-white py-3 pl-11 pr-11 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 ${
      touched[field] && getFieldError(field)
        ? "border-red-400 focus:ring-4 focus:ring-red-100"
        : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
    }`;


  const FieldError = ({ field }) => (
    <AnimatePresence>
      {touched[field] && getFieldError(field) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
        >
          <AlertCircle size={13} />
          {getFieldError(field)}
        </motion.p>
      )}
    </AnimatePresence>
  );


  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-2 bg-slate-50 overflow-x-hidden">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-slate-950 text-white p-10 sm:p-12"
      >
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, 40, 0],
                  y: [0, 25, 0],
                  scale: [1, 1.15, 1],
                }
          }
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl pointer-events-none"
        />

        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, -30, 0],
                  y: [0, -25, 0],
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"
        />

        <motion.div
          {...fadeUp(0.1)}
          className="relative z-10 flex items-center gap-3"
        >
          <motion.div
            whileHover={reduceMotion ? {} : { rotate: 8, scale: 1.08 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25"
          >
            <Building2 size={25} />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">WorkSphere</h1>
            <p className="text-[11px] tracking-widest text-slate-400 uppercase">
              Human Resource Management
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 max-w-lg my-auto py-10">
          <motion.span
            {...fadeUp(0.2)}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-indigo-200"
          >
            <Sparkles size={16} />
            Employee Registration
          </motion.span>

          <motion.h2
            {...fadeUp(0.3)}
            className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight"
          >
            Your workspace
            <span className="block mt-1 text-indigo-400">starts here.</span>
          </motion.h2>

          <motion.p
            {...fadeUp(0.4)}
            className="mt-6 text-base xl:text-lg leading-relaxed text-slate-400"
          >
            Create your employee account and manage attendance, leave
            applications, payroll information, and more from one workspace.
          </motion.p>

          <div className="mt-10 space-y-4">
            {[
              "Track attendance and work hours",
              "Submit and manage leave requests",
              "Access salary and payroll details",
              "View your personal HR dashboard",
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={reduceMotion ? false : { opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.5 + index * 0.1,
                }}
                whileHover={reduceMotion ? {} : { x: 5 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <CheckCircle2 size={19} className="shrink-0 text-indigo-400" />
                <span className="text-sm text-slate-200">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} WorkSphere HRMS
        </p>
      </motion.div>

      <div className="flex items-center justify-center px-4 sm:px-4 py-8 sm:py-12">
        <div className="w-full">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 size={23} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">WorkSphere</h1>
          </div>

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
              ease: "easeOut",
            }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-xl shadow-slate-200/50"
          >
            <motion.div {...fadeUp(0.15)} className="mb-6">
              <p className="mb-2 text-xs font-bold tracking-widest text-indigo-600 uppercase">
                Get Started
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Create Account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Join WorkSphere and access your employee workspace.
              </p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <motion.div {...fadeUp(0.2)}>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("name")}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={60}
                    aria-invalid={Boolean(
                      touched.name && getFieldError("name"),
                    )}
                    className={inputClass("name")}
                  />
                </div>

                <FieldError field="name" />
              </motion.div>

              <motion.div {...fadeUp(0.27)}>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@company.com"
                    autoComplete="email"
                    maxLength={254}
                    aria-invalid={Boolean(
                      touched.email && getFieldError("email"),
                    )}
                    className={inputClass("email")}
                  />
                </div>

                <FieldError field="email" />
              </motion.div>

              <motion.div {...fadeUp(0.34)}>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password")}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    maxLength={64}
                    aria-invalid={Boolean(
                      touched.password && getFieldError("password"),
                    )}
                    className={inputClass("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <AnimatePresence>
                  {form.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              level <= passwordScore
                                ? passwordScore <= 2
                                  ? "bg-red-500"
                                  : passwordScore <= 4
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Password strength:{" "}
                        <span
                          className={
                            passwordScore <= 2
                              ? "text-red-600"
                              : passwordScore <= 4
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }
                        >
                          {passwordStrength}
                        </span>
                      </p>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-1.5 text-xs ${
                              check.valid
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            {check.label}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <FieldError field="password" />
              </motion.div>

              <motion.div {...fadeUp(0.41)}>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    maxLength={64}
                    aria-invalid={Boolean(
                      touched.confirmPassword &&
                      getFieldError("confirmPassword"),
                    )}
                    className={inputClass("confirmPassword")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md cursor-pointer p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {form.confirmPassword &&
                  form.confirmPassword === form.password && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 size={14} />
                      Passwords match
                    </p>
                  )}

                <FieldError field="confirmPassword" />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={
                  reduceMotion || loading ? {} : { scale: 1.02, y: -2 }
                }
                whileTap={reduceMotion || loading ? {} : { scale: 0.98 }}
                className="mt-2 flex w-full items-center justify-center gap-2.5 cursor-pointer rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
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

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>

          <p className="mt-6 text-center text-xs text-slate-400">
            WorkSphere — Human Resource Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
