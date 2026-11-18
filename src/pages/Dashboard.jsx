import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  CalendarCheck,
  CalendarDays,
  Clock3,
  Wallet,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../services/api";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const fadeIn = (delay = 0, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    delay,
    ease: "easeOut",
  },
});

const StatCard = ({
  title,
  value,
  icon: Icon,
  link,
  loading,
  index,
  currency = false,
  color = "indigo",
}) => {
  const reduced = useReducedMotion();
  const themes = {
    indigo: {
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-600",
      circle: "bg-indigo-100/60",
      border: "hover:border-indigo-200",
      label: "text-indigo-600",
      arrow: "group-hover:bg-indigo-600",
    },
    emerald: {
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      circle: "bg-emerald-100/60",
      border: "hover:border-emerald-200",
      label: "text-emerald-600",
      arrow: "group-hover:bg-emerald-600",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      circle: "bg-blue-100/60",
      border: "hover:border-blue-200",
      label: "text-blue-600",
      arrow: "group-hover:bg-blue-600",
    },
    amber: {
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      circle: "bg-amber-100/60",
      border: "hover:border-amber-200",
      label: "text-amber-600",
      arrow: "group-hover:bg-amber-600",
    },
    violet: {
      iconBg: "bg-violet-100",
      iconText: "text-violet-600",
      circle: "bg-violet-100/60",
      border: "hover:border-violet-200",
      label: "text-violet-600",
      arrow: "group-hover:bg-violet-600",
    },
  };

  const theme = themes[color] || themes.indigo;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: "easeOut",
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className="h-full min-w-0"
    >
      <Link
        to={link}
        className={`group relative flex h-full min-h-[150px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg ${theme.border}`}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${theme.circle} transition-transform duration-500 group-hover:scale-125`}
        />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconText}`}
          >
            <Icon size={20} strokeWidth={1.9} />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-100 bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Overview
          </div>
        </div>

        <div className="relative z-10 mt-3 min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <motion.h3
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-1 break-words text-[24px] font-bold tracking-tight text-slate-900 sm:text-[26px]"
            >
              {currency
                ? money(value)
                : Number(value || 0).toLocaleString("en-IN")}
            </motion.h3>
          )}
        </div>

        <div className="relative z-10 mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
          <span className={`text-xs font-semibold ${theme.label}`}>
            View Details
          </span>

          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 group-hover:text-white ${theme.arrow}`}
          >
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

const EmployeeAvatar = ({ name }) => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
    {name?.charAt(0)?.toUpperCase() || "U"}
  </div>
);

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        active ? "bg-emerald-500" : "bg-rose-500"
      }`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

const Dashboard = () => {
  const reduced = useReducedMotion();
  const user = getUser();
  const isAdmin = user.role === "admin";
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myPayroll, setMyPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");
        if (isAdmin) {
          const [statsRes, employeesRes] = await Promise.all([
            api.get("/dashboard/stats", { signal }),
            api.get("/employees", { signal }),
          ]);

          if (signal?.aborted) return;
          setStats(statsRes.data);
          setEmployees(getArray(employeesRes.data));
        } else {
          const [attendanceRes, leavesRes, payrollRes] = await Promise.all([
            api.get("/attendance/my", { signal }),
            api.get("/leaves/my", { signal }),
            api.get("/payroll/my", { signal }),
          ]);

          if (signal?.aborted) return;
          setMyAttendance(getArray(attendanceRes.data));
          setMyLeaves(getArray(leavesRes.data));
          setMyPayroll(getArray(payrollRes.data));
        }
      } catch (err) {
        if (signal?.aborted || err.code === "ERR_CANCELED") {
          return;
        }
        setError(
          err.response?.data?.message || "Unable to load dashboard data.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [fetchDashboard]);


  const adminCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees,
      icon: Users,
      link: "/employees",
      color: "indigo",
    },
    {
      title: "Active Employees",
      value: stats?.activeEmployees,
      icon: UserCheck,
      link: "/employees",
      color: "emerald",
    },
    {
      title: "Present Today",
      value: stats?.presentToday,
      icon: CalendarCheck,
      link: "/attendance",
      color: "blue",
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves,
      icon: Clock3,
      link: "/leaves",
      color: "amber",
    },
    {
      title: "Monthly Base Payroll",
      value: stats?.monthlyBaseSalary,
      icon: Wallet,
      link: "/payroll",
      color: "violet",
      currency: true,
    },
  ];


  const employeeCards = [
    {
      title: "Attendance Records",
      value: myAttendance.length,
      icon: CalendarCheck,
      link: "/attendance",
      color: "indigo",
    },
    {
      title: "Leave Requests",
      value: myLeaves.length,
      icon: CalendarDays,
      link: "/leaves",
      color: "amber",
    },
    {
      title: "Payroll Records",
      value: myPayroll.length,
      icon: Wallet,
      link: "/payroll",
      color: "emerald",
    },
  ];

  const cards = isAdmin ? adminCards : employeeCards;

  const recentEmployees = [...employees]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, 6);


  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });


  const quickActions = isAdmin
    ? [
        {
          title: "Manage Employees",
          subtitle: "View and manage your team",
          icon: Users,
          path: "/employees",
        },
        {
          title: "Attendance",
          subtitle: "Review daily attendance",
          icon: CalendarCheck,
          path: "/attendance",
        },
        {
          title: "Leave Requests",
          subtitle: "Review employee requests",
          icon: CalendarDays,
          path: "/leaves",
        },
        {
          title: "Payroll",
          subtitle: "Manage salary records",
          icon: Wallet,
          path: "/payroll",
        },
      ]
    : [
        {
          title: "My Attendance",
          subtitle: "View your attendance",
          icon: CalendarCheck,
          path: "/attendance",
        },
        {
          title: "Apply for Leave",
          subtitle: "Manage leave requests",
          icon: CalendarDays,
          path: "/leaves",
        },
        {
          title: "My Payroll",
          subtitle: "View salary details",
          icon: Wallet,
          path: "/payroll",
        },
      ];


  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip pb-6">
      <motion.header
        {...fadeIn(0, reduced)}
        className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <LayoutDashboard size={15} />
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
              Workspace Overview
            </span>
          </div>

          <h1 className="text-[23px] font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Dashboard
          </h1>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
            Monitor employee activity and manage your workspace.
          </p>
        </div>
      </motion.header>


      <motion.section
        {...fadeIn(0.05, reduced)}
        className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-900 px-5 py-6 text-white sm:px-7 sm:py-7"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
              <Sparkles size={13} />
              {isAdmin ? "Admin Workspace" : "Employee Workspace"}
            </div>

            <h2 className="break-words text-xl font-bold tracking-tight sm:text-2xl">
              Welcome back,{" "}
              <span className="text-indigo-300">{user.name || "User"}!</span>
            </h2>

            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isAdmin
                ? "Manage your team, attendance, leave requests, and payroll in one place."
                : "Track your attendance, leave requests, and salary records."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-xs text-indigo-100">
            <CalendarDays size={15} />
            <span>{today}</span>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>


      <section className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? "Workforce Statistics" : "My Statistics"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Important HR metrics and employee activity"
                : "A summary of your activity"}
            </p>
          </div>

          <span className="hidden items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 sm:inline-flex">
            <Activity size={14} />
            Overview
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <StatCard
              key={card.title}
              {...card}
              index={index}
              loading={loading}
            />
          ))}
        </div>
      </section>


      <motion.section {...fadeIn(0.12, reduced)} className="min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Access frequently used HR features.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.path}
                whileHover={reduced ? undefined : { y: -3 }}
                className="min-w-0"
              >
                <Link
                  to={action.path}
                  className="group flex h-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {action.title}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {action.subtitle}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-600"
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {isAdmin && (
        <motion.section
          {...fadeIn(0.18, reduced)}
          className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Recent Employees
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Recently added team members
                </p>
              </div>
            </div>

            <Link
              to="/employees"
              className="group inline-flex w-fit shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-indigo-600 sm:self-auto"
            >
              View All
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="hidden w-full min-w-0 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[36%] px-3 py-4 font-semibold xl:px-6">
                    Employee
                  </th>
                  <th className="w-[23%] px-3 py-4 font-semibold xl:px-6">
                    Department
                  </th>
                  <th className="w-[23%] px-3 py-4 font-semibold xl:px-6">
                    Designation
                  </th>
                  <th className="w-[18%] px-3 py-4 font-semibold xl:px-6">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentEmployees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="min-w-0 px-3 py-4 xl:px-6">
                      <div className="flex min-w-0 max-w-full items-center gap-3">
                        <div className="shrink-0">
                          <EmployeeAvatar name={employee.name} />
                        </div>

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            title={employee.name}
                            className="truncate font-semibold text-slate-900"
                          >
                            {employee.name}
                          </p>

                          <p
                            title={employee.email}
                            className="mt-1 truncate text-xs text-slate-500"
                          >
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="min-w-0 px-3 py-4 xl:px-6">
                      <p
                        title={employee.department || "--"}
                        className="truncate text-slate-600"
                      >
                        {employee.department || "--"}
                      </p>
                    </td>

                    <td className="min-w-0 px-3 py-4 xl:px-6">
                      <p
                        title={employee.designation || "--"}
                        className="truncate text-slate-600"
                      >
                        {employee.designation || "--"}
                      </p>
                    </td>

                    <td className="min-w-0 px-3 py-4 xl:px-6">
                      <div className="flex min-w-0 flex-wrap items-center">
                        <StatusBadge active={employee.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden">
            {recentEmployees.map((employee) => (
              <div
                key={employee._id}
                className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="shrink-0">
                    <EmployeeAvatar name={employee.name} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {employee.name}
                    </p>

                    <p className="mt-1 whitespace-normal break-all text-xs leading-relaxed text-slate-500">
                      {employee.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center">
                  <StatusBadge active={employee.isActive} />
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Department</p>
                    <p className="mt-1 break-words text-sm font-medium leading-relaxed text-slate-700">
                      {employee.department || "--"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Designation</p>
                    <p className="mt-1 break-words text-sm font-medium leading-relaxed text-slate-700">
                      {employee.designation || "--"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && recentEmployees.length === 0 && (
            <div className="flex min-w-0 flex-col items-center px-4 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={26} />
              </div>
              <p className="font-semibold text-slate-800">No employees found</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Add employees to start managing your team.
              </p>

              <Link
                to="/employees"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <Plus size={17} />
                Manage Employees
              </Link>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
};

export default Dashboard;
