import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  Clock3,
  LogIn,
  LogOut,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  X,
  BriefcaseBusiness,
} from "lucide-react";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import api from "../services/api";

// ================= HELPERS =================

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const getRecords = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getToday = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type) => parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const formatTime = (value) => {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

const formatDate = (value) => {
  if (!value) return "--";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "present":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "absent":
      return "bg-red-50 text-red-700 border-red-200";
    case "late":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const fadeUp = (delay = 0, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    delay,
    ease: "easeOut",
  },
});

// ================= STATUS BADGE =================

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
      status,
    )}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    <span className="capitalize">{status || "Unknown"}</span>
  </span>
);

// ================= SUMMARY CARD =================

{
  /* ================= SUMMARY CARD ================= */
}

const SummaryCard = ({ title, value, icon: Icon, loading, index, theme }) => {
  const reduced = useReducedMotion();

  const themes = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <motion.div
      {...fadeUp(index * 0.06, reduced)}
      whileHover={reduced ? undefined : { y: -3 }}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* ICON */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            themes[theme] || themes.indigo
          }`}
        >
          <Icon size={20} />
        </div>

        {/* NAME AND VALUE BESIDE ICON */}
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-medium leading-snug text-slate-500 sm:text-sm">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
          ) : (
            <h3 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </h3>
          )}
        </div>

        {/* ARROW */}
        <ArrowUpRight
          size={16}
          className="shrink-0 self-start text-slate-300"
        />
      </div>
    </motion.div>
  );
};

// ================= MAIN COMPONENT =================

export default function Attendance() {
  const reduced = useReducedMotion();

  const user = getUser();
  const isAdmin = user.role === "admin";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState("");

  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ================= FETCH ATTENDANCE =================

  const fetchAttendance = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");

        const endpoint = isAdmin ? "/attendance/all" : "/attendance/my";

        const response = await api.get(endpoint, { signal });

        if (signal?.aborted) return;

        setRecords(getRecords(response.data));
      } catch (err) {
        if (signal?.aborted || err.code === "ERR_CANCELED") return;

        setError(
          err.response?.data?.message || "Unable to load attendance records.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchAttendance(controller.signal);

    return () => controller.abort();
  }, [fetchAttendance]);

  // ================= SEARCH VALIDATION =================

  const handleSearchChange = (event) => {
    const input = event.target.value;

    if (input.length > 50) {
      setSearchError("Maximum 50 characters allowed.");
      return;
    }

    // Allows names, email addresses, statuses and dates.
    const cleaned = input
      .replace(/[^a-zA-Z0-9@.\-/ ]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");

    setSearch(cleaned);

    if (input !== cleaned) {
      setSearchError("Special characters are not allowed.");
    } else {
      setSearchError("");
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchError("");
  };

  // ================= CHECK IN / CHECK OUT =================

  const handleAttendance = async (type) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setActionType(type);

      setMessage("");
      setError("");

      const endpoint =
        type === "in" ? "/attendance/check-in" : "/attendance/check-out";

      const response = await api.post(endpoint);

      setMessage(
        response.data?.message ||
          (type === "in"
            ? "Checked in successfully."
            : "Checked out successfully."),
      );

      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update attendance.");
    } finally {
      setActionLoading(false);
      setActionType("");
    }
  };

  // ================= TODAY'S ATTENDANCE =================

  const today = getToday();

  const todayRecord = records.find(
    (record) =>
      String(record.date || "").slice(0, 10) === today &&
      (!isAdmin ||
        String(record.employee?._id || record.employee) === String(user.id)),
  );

  const presentToday = records.filter(
    (record) => String(record.date || "").slice(0, 10) === today,
  ).length;

  const completedShifts = records.filter((record) =>
    Boolean(record.checkOut),
  ).length;

  const isCheckedIn = Boolean(todayRecord);
  const isCheckedOut = Boolean(todayRecord?.checkOut);

  // ================= STATISTICS =================

  const stats = isAdmin
    ? [
        {
          title: "Total Records",
          value: records.length,
          icon: CalendarDays,
          theme: "indigo",
        },
        {
          title: "Present Today",
          value: presentToday,
          icon: Users,
          theme: "emerald",
        },
        {
          title: "Completed Shifts",
          value: completedShifts,
          icon: CheckCircle2,
          theme: "amber",
        },
      ]
    : [
        {
          title: "Present Days",
          value: records.length,
          icon: CalendarDays,
          theme: "indigo",
        },
        {
          title: "Today's Check-In",
          value: formatTime(todayRecord?.checkIn),
          icon: LogIn,
          theme: "emerald",
        },
        {
          title: "Today's Check-Out",
          value: formatTime(todayRecord?.checkOut),
          icon: LogOut,
          theme: "amber",
        },
      ];

  // ================= FILTER RECORDS =================

  const filteredRecords = records
    .filter((record) => {
      const term = search.trim().toLowerCase();

      if (!term) return true;

      return [
        record.employee?.name,
        record.employee?.email,
        record.date,
        formatDate(record.date),
        record.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  // ================= UI =================

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip pb-8">
      {/* PAGE HEADER */}
      <motion.header
        {...fadeUp(0, reduced)}
        className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BriefcaseBusiness size={16} />
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">
              HR Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Attendance
          </h1>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Manage daily attendance and track work activity.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => fetchAttendance()}
          disabled={loading || actionLoading}
          whileTap={reduced ? undefined : { scale: 0.96 }}
          className="inline-flex h-9 w-fit shrink-0 items-center  cursor-pointer justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </motion.button>
      </motion.header>

      {/* ALERT MESSAGE */}
      <AnimatePresence>
        {(message || error) && (
          <motion.div
            key={error ? "error" : "success"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role={error ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0" />
            )}

            <p className="min-w-0 break-words">{error || message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUMMARY CARDS */}
      <section className="min-w-0">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat, index) => (
            <SummaryCard
              key={stat.title}
              {...stat}
              index={index}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* TODAY'S ATTENDANCE */}
      {!isAdmin && (
        <motion.section
          {...fadeUp(0.1, reduced)}
          className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* HEADER */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarCheck size={19} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  Today's Attendance
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{todayLabel}</p>
              </div>
            </div>

            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                !isCheckedIn
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : isCheckedOut
                    ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  !isCheckedIn
                    ? "bg-slate-400"
                    : isCheckedOut
                      ? "bg-indigo-500"
                      : "bg-emerald-500 animate-pulse"
                }`}
              />

              {!isCheckedIn
                ? "Not Checked In"
                : isCheckedOut
                  ? "Shift Completed"
                  : "Currently Working"}
            </motion.div>
          </div>

          {/* CONTENT */}
          <div className="p-4 sm:p-5">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              {/* CHECK IN CARD */}
              <motion.div
                whileHover={reduced ? undefined : { y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <LogIn size={19} />
                    </div>

                    {isCheckedIn && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 size={13} />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-medium text-slate-500">
                      Check In Time
                    </p>

                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px]">
                      {formatTime(todayRecord?.checkIn)}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Start of your workday
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleAttendance("in")}
                  disabled={loading || actionLoading || isCheckedIn}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                    isCheckedIn
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md"
                  }`}
                >
                  {actionLoading && actionType === "in" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isCheckedIn ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <LogIn size={16} />
                  )}

                  {isCheckedIn ? "Checked In" : "Check In Now"}
                </motion.button>
              </motion.div>

              {/* CHECK OUT CARD */}
              <motion.div
                whileHover={reduced ? undefined : { y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <LogOut size={19} />
                    </div>

                    {isCheckedOut && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                        <CheckCircle2 size={13} />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-medium text-slate-500">
                      Check Out Time
                    </p>

                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px]">
                      {formatTime(todayRecord?.checkOut)}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      End of your workday
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleAttendance("out")}
                  disabled={
                    loading || actionLoading || !isCheckedIn || isCheckedOut
                  }
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                    isCheckedOut
                      ? "bg-indigo-50 text-indigo-700"
                      : !isCheckedIn
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md"
                  }`}
                >
                  {actionLoading && actionType === "out" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isCheckedOut ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <LogOut size={16} />
                  )}

                  {isCheckedOut ? "Checked Out" : "Check Out Now"}
                </motion.button>
              </motion.div>
            </div>

            {/* BOTTOM INFORMATION */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 sm:px-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                <Clock3 size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  Attendance Reminder
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                  {!isCheckedIn
                    ? "Your workday hasn't started yet. Check in to record your attendance."
                    : isCheckedOut
                      ? "Your attendance has been recorded successfully for today."
                      : "You're currently checked in. Remember to check out before leaving."}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ATTENDANCE RECORDS */}
      <motion.section
        {...fadeUp(0.15, reduced)}
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {isAdmin ? "Employee Attendance Records" : "Attendance History"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredRecords.length} records
            </p>
          </div>

          {/* VALIDATED SEARCH BAR */}
          <div className="w-full min-w-0 lg:w-72">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                maxLength={50}
                autoComplete="off"
                placeholder="Search name, status or date..."
                aria-label="Search attendance records"
                aria-invalid={Boolean(searchError)}
                className={`h-10 w-full min-w-0 rounded-xl border bg-slate-50/50 py-2 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 ${
                  searchError
                    ? "border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                }`}
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {searchError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="mt-1.5 text-xs text-red-600"
                >
                  {searchError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                {isAdmin && <th className="px-4 py-3.5">Employee</th>}
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Check In</th>
                <th className="px-4 py-3.5">Check Out</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    {isAdmin && (
                      <td className="min-w-0 px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">
                          {record.employee?.name || "Unknown"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {record.employee?.email || "--"}
                        </p>
                      </td>
                    )}

                    <td className="px-4 py-4 text-slate-700">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatTime(record.checkIn)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatTime(record.checkOut)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE / TABLET CARDS */}
        {!loading && (
          <div className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden">
            {filteredRecords.map((record) => (
              <motion.div
                key={record._id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduced ? undefined : { y: -2 }}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarDays
                      size={16}
                      className="shrink-0 text-indigo-600"
                    />
                    {formatDate(record.date)}
                  </div>

                  <StatusBadge status={record.status} />
                </div>

                {isAdmin && (
                  <div className="mb-3 border-t border-slate-200 pt-3">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {record.employee?.name || "Unknown"}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {record.employee?.email || "--"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400">
                      Check In
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {formatTime(record.checkIn)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400">
                      Check Out
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {formatTime(record.checkOut)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-14">
            <Loader2 size={23} className="animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">
              Loading attendance records...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredRecords.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <CalendarDays size={23} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              No attendance records found
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              {search
                ? "Try another name, status, or date."
                : "Attendance records will appear here."}
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
