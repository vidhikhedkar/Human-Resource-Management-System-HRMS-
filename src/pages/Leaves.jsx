import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock3,
  X,
  RefreshCw,
  Search,
  FileText,
  AlertCircle,
  CalendarRange,
  Send,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../services/api";

const initialForm = {
  leaveType: "Casual",
  startDate: "",
  endDate: "",
  reason: "",
};

const leaveTypes = ["Casual", "Sick", "Annual", "Other"];

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const getLeaves = (data) => {
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
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getStatus = (value) => String(value || "").toLowerCase();

const fadeUp = (delay = 0, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.32,
    delay,
    ease: "easeOut",
  },
});

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const normalized = getStatus(status);

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        styles[normalized] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, theme, index, loading }) => {
  const reduced = useReducedMotion();

  const themes = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      {...fadeUp(index * 0.05, reduced)}
      whileHover={reduced ? undefined : { y: -2 }}
      className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          themes[theme] || themes.indigo
        }`}
      >
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
        {loading ? (
          <div className="mt-2 h-7 w-16 animate-pulse rounded-md bg-slate-100" />
        ) : (
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        )}
      </div>
    </motion.div>
  );
};

const ApprovalActions = ({ leave, processingId, onChangeStatus }) => {
  const reduced = useReducedMotion();
  if (getStatus(leave.status) !== "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 size={14} />
        Reviewed
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <motion.button
        type="button"
        disabled={Boolean(processingId)}
        onClick={() => onChangeStatus(leave._id, "Approved")}
        whileTap={reduced ? undefined : { scale: 0.96 }}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
      >
        {processingId === leave._id ? (
          <RefreshCw size={13} className="animate-spin" />
        ) : (
          <CheckCircle2 size={14} />
        )}
        Approve
      </motion.button>

      <motion.button
        type="button"
        disabled={Boolean(processingId)}
        onClick={() => onChangeStatus(leave._id, "Rejected")}
        whileTap={reduced ? undefined : { scale: 0.96 }}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
      >
        <XCircle size={14} />
        Reject
      </motion.button>
    </div>
  );
};

export default function Leaves() {
  const reduced = useReducedMotion();
  const user = getUser();
  const isAdmin = user.role === "admin";

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = getToday();

  const fetchLeaves = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");
        const endpoint = isAdmin ? "/leaves/all" : "/leaves/my";
        const response = await api.get(endpoint, { signal });
        if (signal?.aborted) return;
        setLeaves(getLeaves(response.data));
      } catch (err) {
        if (signal?.aborted || err.code === "ERR_CANCELED") return;
        setError(
          err.response?.data?.message || "Unable to load leave requests.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaves(controller.signal);
    return () => controller.abort();
  }, [fetchLeaves]);

  const handleSearchChange = (event) => {
    const input = event.target.value;
    if (input.length > 50) {
      setSearchError("Maximum 50 characters allowed.");
      return;
    }

    const cleaned = input
      .replace(/[^a-zA-Z0-9@.\-/ ]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");
    setSearch(cleaned);

    if (cleaned !== input) {
      setSearchError("Special characters are not allowed.");
    } else {
      setSearchError("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSearchError("");
    setStatusFilter("all");
  };

  const validateField = (name, value, currentForm = form) => {
    if (name === "leaveType") {
      if (!leaveTypes.includes(value)) {
        return "Please select a valid leave type.";
      }
    }

    if (name === "startDate") {
      if (!value) return "Start date is required.";
      if (value < getToday()) return "Past dates are not allowed.";
    }

    if (name === "endDate") {
      if (!value) return "End date is required.";
      if (currentForm.startDate && value < currentForm.startDate) {
        return "End date cannot be before start date.";
      }
    }

    if (name === "reason") {
      const reason = String(value || "").trim();
      if (!reason) return "Reason is required.";
      if (reason.length < 10) return "Enter at least 10 characters.";
      if (reason.length > 300) return "Maximum 300 characters allowed.";
      if (/[<>{}\[\]]/.test(reason)) {
        return "Special characters < > { } [ ] are not allowed.";
      }
    }
    return "";
  };

  const validateForm = () => {
    const errors = {};
    ["leaveType", "startDate", "endDate", "reason"].forEach((field) => {
      const fieldError = validateField(field, form[field], form);
      if (fieldError) errors[field] = fieldError;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const cleaned =
      name === "reason"
        ? value.replace(/[<>{}\[\]]/g, "").slice(0, 300)
        : value;
    const updated = { ...form, [name]: cleaned };

    if (name === "startDate" && updated.endDate && updated.endDate < cleaned) {
      updated.endDate = "";
    }

    setForm(updated);
    setFormErrors((previous) => ({
      ...previous,
      [name]: validateField(name, cleaned, updated),
      ...(name === "startDate" ? { endDate: "" } : {}),
    }));
  };


  const handleApply = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    setMessage("");
    if (!validateForm()) return;
    try {
      setSaving(true);
      await api.post("/leaves", {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });

      setShowModal(false);
      setForm(initialForm);
      setFormErrors({});
      await fetchLeaves();
      setMessage("Leave application submitted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply for leave.");
    } finally {
      setSaving(false);
    }
  };


  const handleStatus = async (id, status) => {
    try {
      setProcessingId(id);
      setError("");
      setMessage("");
      await api.patch(`/leaves/${id}/status`, { status });
      await fetchLeaves();
      setMessage(`Leave ${status.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update leave status.");
    } finally {
      setProcessingId(null);
    }
  };


  const openModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setError("");
    setShowModal(true);
  }

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormErrors({});
  };


  const pending = leaves.filter(
    (leave) => getStatus(leave.status) === "pending",
  ).length;

  const approved = leaves.filter(
    (leave) => getStatus(leave.status) === "approved",
  ).length;

  const rejected = leaves.filter(
    (leave) => getStatus(leave.status) === "rejected",
  ).length;

  const stats = [
    {
      title: "Total Requests",
      value: leaves.length,
      icon: CalendarDays,
      theme: "indigo",
    },
    { title: "Pending", value: pending, icon: Clock3, theme: "amber" },
    {
      title: "Approved",
      value: approved,
      icon: CheckCircle2,
      theme: "emerald",
    },
    { title: "Rejected", value: rejected, icon: XCircle, theme: "rose" },
  ];


  const filteredLeaves = leaves
    .filter((leave) => {
      const matchesStatus =
        statusFilter === "all" || getStatus(leave.status) === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        [
          leave.employee?.name,
          leave.employee?.email,
          leave.leaveType,
          leave.reason,
          leave.status,
          formatDate(leave.startDate),
          formatDate(leave.endDate),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.startDate) -
        new Date(a.createdAt || a.startDate),
    );


  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip pb-6">
      <motion.header
        {...fadeUp(0, reduced)}
        className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays size={17} />
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
              HR Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Leave Management
          </h1>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {isAdmin
              ? "Review and manage employee leave applications."
              : "Apply for leave and track your requests."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => fetchLeaves()}
            disabled={loading}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            className="inline-flex h-9 items-center gap-2 rounded-lg cursor-pointer border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </motion.button>

          {!isAdmin && (
            <motion.button
              type="button"
              onClick={openModal}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus size={15} />
              Apply Leave
            </motion.button>
          )}
        </div>
      </motion.header>

      <AnimatePresence>
        {(error || message) && (
          <motion.div
            key={error ? "error" : "success"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role={error ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <p className="min-w-0 break-words">{error || message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-4">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.title}
              {...stat}
              index={index}
              loading={loading}
            />
          ))}
        </div>
      </section>

      <motion.section
        {...fadeUp(0.12, reduced)}
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {isAdmin ? "All Leave Requests" : "My Leave Requests"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredLeaves.length} requests found
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
            <div className="w-full min-w-0 sm:w-56">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search requests..."
                  aria-label="Search leave requests"
                  aria-invalid={Boolean(searchError)}
                  maxLength={50}
                  autoComplete="off"
                  className={`h-9 w-full min-w-0 rounded-lg border bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:ring-2 ${
                    searchError
                      ? "border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/10"
                  }`}
                />
              </div>

              <AnimatePresence>
                {searchError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="mt-1 text-xs text-rose-600"
                  >
                    {searchError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-full sm:w-36">
              <SlidersHorizontal
                size={14}
                className="pointer-events-none absolute  cursor-pointer left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by leave status"
                className="h-9 w-full rounded-lg border border-slate-200 cursor-pointer bg-white pl-9 pr-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center justify-center cursor-pointer gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <RotateCcw size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="hidden xl:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                {isAdmin && <th className="w-[19%] px-4 py-3.5">Employee</th>}
                <th className="px-4 py-3.5">Leave Type</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">End Date</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Status</th>
                {isAdmin && <th className="w-[18%] px-4 py-3.5">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredLeaves.map((leave) => (
                  <tr
                    key={leave._id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">
                          {leave.employee?.name || "Unknown"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {leave.employee?.email || "--"}
                        </p>
                      </td>
                    )}

                    <td className="px-4 py-4 font-medium text-slate-700">
                      {leave.leaveType}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(leave.startDate)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(leave.endDate)}
                    </td>
                    <td className="px-4 py-4">
                      <p
                        className="truncate text-slate-600"
                        title={leave.reason}
                      >
                        {leave.reason}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={leave.status} />
                    </td>

                    {isAdmin && (
                      <td className="px-4 py-4">
                        <ApprovalActions
                          leave={leave}
                          processingId={processingId}
                          onChangeStatus={handleStatus}
                        />
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>


        {!loading && (
          <div className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:hidden">
            {filteredLeaves.map((leave) => (
              <div
                key={leave._id}
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {leave.leaveType} Leave
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>

                {isAdmin && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {leave.employee?.name || "Unknown"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {leave.employee?.email || "--"}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex-1 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-400">Reason</p>
                  <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">
                    {leave.reason}
                  </p>
                </div>

                {isAdmin && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <ApprovalActions
                      leave={leave}
                      processingId={processingId}
                      onChangeStatus={handleStatus}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <RefreshCw size={20} className="animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading leave requests...</p>
          </div>
        )}

        {!loading && filteredLeaves.length === 0 && (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileText size={23} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              No leave requests found
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Leave requests will appear here."}
            </p>
          </div>
        )}
      </motion.section>


      <AnimatePresence>
        {showModal && (
          <motion.div
            key="leave-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                closeModal();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-dialog-title"
              initial={reduced ? false : { opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full min-w-0 max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
              style={{ maxHeight: "calc(100dvh - 24px)" }}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                    <CalendarRange size={15} />
                    Leave Application
                  </div>
                  <h2
                    id="leave-dialog-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Apply for Leave
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Fill in the details to submit your request.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleApply} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="leaveType"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Leave Type <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="leaveType"
                    name="leaveType"
                    value={form.leaveType}
                    onChange={handleFormChange}
                    aria-invalid={Boolean(formErrors.leaveType)}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 ${
                      formErrors.leaveType
                        ? "border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  {formErrors.leaveType && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {formErrors.leaveType}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label
                      htmlFor="leaveStartDate"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="leaveStartDate"
                      type="date"
                      name="startDate"
                      min={today}
                      value={form.startDate}
                      onChange={handleFormChange}
                      aria-invalid={Boolean(formErrors.startDate)}
                      className={`h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 ${
                        formErrors.startDate
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                    />

                    {formErrors.startDate && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formErrors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="leaveEndDate"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="leaveEndDate"
                      type="date"
                      name="endDate"
                      min={form.startDate || today}
                      value={form.endDate}
                      onChange={handleFormChange}
                      aria-invalid={Boolean(formErrors.endDate)}
                      className={`h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 ${
                        formErrors.endDate
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                    />

                    {formErrors.endDate && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="leaveReason"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Reason <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="leaveReason"
                    name="reason"
                    rows={4}
                    maxLength={300}
                    value={form.reason}
                    onChange={handleFormChange}
                    placeholder="Briefly explain the reason for your leave..."
                    aria-invalid={Boolean(formErrors.reason)}
                    className={`w-full resize-none rounded-xl border bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 ${
                      formErrors.reason
                        ? "border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  />

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {formErrors.reason ? (
                        <p className="text-xs text-red-600">
                          {formErrors.reason}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Minimum 10 characters.
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">
                      {form.reason.length}/300
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {saving ? "Submitting..." : "Submit Request"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
