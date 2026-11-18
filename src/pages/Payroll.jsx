import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  IndianRupee,
  CheckCircle2,
  Clock3,
  X,
  RefreshCw,
  Search,
  ReceiptText,
  AlertCircle,
  Loader2,
  CalendarDays,
  ArrowUpRight,
  Users,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../services/api";


const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
};

const createInitialForm = () => ({
  employeeId: "",
  month: currentMonth(),
  bonus: "0",
  deductions: "0",
});

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const isPaid = (status) => String(status || "").toLowerCase() === "paid";
const isPending = (status) => String(status || "").toLowerCase() === "pending";
const validMoney = (value) =>
  /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(String(value));

const validMonth = (value) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return value <= currentMonth();
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


const StatusBadge = ({ status }) => {
  const paid = isPaid(status);
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {paid ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
      {status || "Pending"}
    </span>
  );
};


const StatCard = ({ title, value, icon: Icon, theme, loading, index }) => {
  const reduced = useReducedMotion();

  const themes = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <motion.div
      {...fadeUp(index * 0.06, reduced)}
      whileHover={reduced ? undefined : { y: -3 }}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            themes[theme] || themes.indigo
          }`}
        >
          <Icon size={19} />
        </div>

        <ArrowUpRight size={15} className="text-slate-300" />
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">
        {title}
      </p>

      {loading ? (
        <div className="mt-2 h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <h3 className="mt-1 break-all text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {value}
        </h3>
      )}
    </motion.div>
  );
};


const FormField = ({ label, error, children, hint }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
      {label}
    </label>

    {children}

    {error ? (
      <p role="alert" className="mt-1.5 text-xs text-red-600">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
    ) : null}
  </div>
);


export default function Payroll() {
  const reduced = useReducedMotion();
  const user = getUser();
  const isAdmin = user.role === "admin";
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const [formErrors, setFormErrors] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const fetchData = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");

        if (isAdmin) {
          const [payrollResponse, employeeResponse] = await Promise.all([
            api.get("/payroll", { signal }),
            api.get("/employees", { signal }),
          ]);

          if (signal?.aborted) return;
          setRecords(getArray(payrollResponse.data));
          setEmployees(
            getArray(employeeResponse.data).filter(
              (employee) => employee.isActive,
            ),
          );
        } else {
          const response = await api.get("/payroll/my", {
            signal,
          });

          if (signal?.aborted) return;

          setRecords(getArray(response.data));
        }
      } catch (err) {
        if (signal?.aborted || err.code === "ERR_CANCELED") return;

        setError(
          err.response?.data?.message || "Unable to load payroll records.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isAdmin],
  );


  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  useEffect(() => {
    if (!showModal) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [showModal]);


  const selectedEmployee = employees.find(
    (employee) => employee._id === form.employeeId,
  );


  const baseSalary = Number(selectedEmployee?.salary || 0);
  const bonus = Number(form.bonus || 0);
  const deductions = Number(form.deductions || 0);
  const calculatedSalary = baseSalary + bonus - deductions;


  const handleSearchChange = (event) => {
    const input = event.target.value;
    if (input.length > 50) {
      setSearchError("Maximum 50 characters allowed.");
      return;
    }
    const cleaned = input
      .replace(/[^a-zA-Z0-9@.\- /]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");

    setSearch(cleaned);
    if (input !== cleaned) {
      setSearchError("Special characters are not allowed in the search field.");
    } else {
      setSearchError("");
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchError("");
  };


  const validateForm = () => {
    const errors = {};
    if (!form.employeeId) {
      errors.employeeId = "Please select an employee.";
    } else if (!selectedEmployee) {
      errors.employeeId = "Please select a valid active employee.";
    }

    if (!form.month) {
      errors.month = "Please select a payroll month.";
    } else if (!validMonth(form.month)) {
      errors.month = "Select a valid month, not in the future.";
    }

    if (!validMoney(form.bonus)) {
      errors.bonus = "Enter a valid amount with up to 2 decimal places.";
    }

    if (!validMoney(form.deductions)) {
      errors.deductions = "Enter a valid amount with up to 2 decimal places.";
    }

    if (selectedEmployee && (!Number.isFinite(baseSalary) || baseSalary < 0)) {
      errors.employeeId = "Employee salary is invalid.";
    }

    if (
      !errors.employeeId &&
      !errors.bonus &&
      !errors.deductions &&
      calculatedSalary < 0
    ) {
      errors.deductions = "Deductions cannot exceed salary plus bonus.";
    }

    const duplicate = records.some(
      (record) =>
        String(record.employee?._id || record.employee) === form.employeeId &&
        record.month === form.month,
    );

    if (duplicate) {
      errors.month = "Payroll already exists for this employee and month.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleMoneyChange = (field, value) => {
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    if (value.length > 12) return;
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFormErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };


  const handleGenerate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!validateForm()) return;
    try {
      setSaving(true);
      await api.post("/payroll", {
        employeeId: form.employeeId,
        month: form.month,
        bonus: Number(form.bonus),
        deductions: Number(form.deductions),
      });
      setShowModal(false);
      setForm(createInitialForm());
      setFormErrors({});
      await fetchData();
      setMessage("Payroll generated successfully.");
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "Unable to generate payroll.";
      setError(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id) => {
    if (processingId) return;
    if (!window.confirm("Mark this payroll record as paid?")) {
      return;
    }
    try {
      setProcessingId(id);
      setError("");
      setMessage("");
      await api.patch(`/payroll/${id}/pay`);
      await fetchData();
      setMessage("Payroll marked as paid successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update payroll status.",
      );
    } finally {
      setProcessingId(null);
    }
  };


  const totalPayroll = records.reduce(
    (sum, record) => sum + Number(record.netSalary || 0),
    0,
  );

  const totalPaid = records
    .filter((record) => isPaid(record.status))
    .reduce((sum, record) => sum + Number(record.netSalary || 0), 0);

  const pendingCount = records.filter((record) =>
    isPending(record.status),
  ).length;


  const stats = [
    {
      title: "Total Payroll",
      value: money(totalPayroll),
      icon: Wallet,
      theme: "indigo",
    },
    {
      title: "Total Paid",
      value: money(totalPaid),
      icon: CheckCircle2,
      theme: "emerald",
    },
    {
      title: "Pending Payments",
      value: pendingCount,
      icon: Clock3,
      theme: "amber",
    },
    {
      title: "Payroll Records",
      value: records.length,
      icon: ReceiptText,
      theme: "violet",
    },
  ];


  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records
      .filter((record) => {
        if (!term) return true;
        return [
          record.employee?.name,
          record.employee?.email,
          record.month,
          record.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) =>
        String(b.month || "").localeCompare(String(a.month || "")),
      );
  }, [records, search]);


  const openModal = () => {
    setForm(createInitialForm());
    setFormErrors({});
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormErrors({});
  };

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal, saving]);


  const inputClass = (hasError) =>
    `h-11 w-full min-w-0 rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition-all focus:ring-4 ${
      hasError
        ? "border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;


  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip pb-8">
      <motion.header
        {...fadeUp(0, reduced)}
        className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet size={16} />
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">
              HR Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Payroll Management
          </h1>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {isAdmin
              ? "Manage employee salaries, bonuses and monthly payments."
              : "View your salary details and payment history."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => fetchData()}
            disabled={loading || saving}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            className="inline-flex h-9 items-center cursor-pointer justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </motion.button>

          {isAdmin && (
            <motion.button
              type="button"
              onClick={openModal}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              className="inline-flex h-9 items-center cursor-pointer justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Plus size={15} />
              Generate Payroll
            </motion.button>
          )}
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {(error || message) && (
          <motion.div
            key={error ? `error-${error}` : `success-${message}`}
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role={error ? "alert" : "status"}
            className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 text-sm ${
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

            <p className="min-w-0 flex-1 break-words">{error || message}</p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
              }}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-70  cursor-pointer hover:opacity-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="min-w-0">
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
        {...fadeUp(0.15, reduced)}
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {isAdmin ? "Employee Payroll Records" : "My Payroll History"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredRecords.length} payroll records
            </p>
          </div>

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
                placeholder="Search payroll records..."
                aria-label="Search payroll records"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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

        <div className="hidden xl:block">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                {isAdmin && <th className="px-3 py-3.5">Employee</th>}
                <th className="px-3 py-3.5">Month</th>
                <th className="px-3 py-3.5">Basic Salary</th>
                <th className="px-3 py-3.5">Bonus</th>
                <th className="px-3 py-3.5">Deductions</th>
                <th className="px-3 py-3.5">Net Salary</th>
                <th className="px-3 py-3.5">Status</th>
                {isAdmin && <th className="px-3 py-3.5">Action</th>}
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
                      <td className="min-w-0 px-3 py-4">
                        <p className="truncate font-semibold text-slate-900">
                          {record.employee?.name || "Unknown"}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-slate-500">
                          {record.employee?.email || "--"}
                        </p>
                      </td>
                    )}

                    <td className="px-3 py-4 font-medium text-slate-700">
                      {record.month}
                    </td>

                    <td className="px-3 py-4">{money(record.baseSalary)}</td>

                    <td className="px-3 py-4 text-emerald-700">
                      +{money(record.bonus)}
                    </td>

                    <td className="px-3 py-4 text-red-600">
                      -{money(record.deductions)}
                    </td>

                    <td className="px-3 py-4 font-bold text-slate-900">
                      {money(record.netSalary)}
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge status={record.status} />
                    </td>

                    {isAdmin && (
                      <td className="px-3 py-4">
                        {isPending(record.status) ? (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(record._id)}
                            disabled={Boolean(processingId)}
                            className="inline-flex items-center gap-1 cursor-pointer rounded-lg bg-indigo-50 px-2.5 py-2 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                          >
                            {processingId === record._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700">
                            Completed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:hidden">
            {filteredRecords.map((record) => (
              <motion.div
                key={record._id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduced ? undefined : { y: -2 }}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarDays
                      size={16}
                      className="shrink-0 text-indigo-600"
                    />
                    {record.month}
                  </div>

                  <StatusBadge status={record.status} />
                </div>

                {isAdmin && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {record.employee?.name || "Unknown"}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {record.employee?.email || "--"}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  {[
                    ["Basic Salary", record.baseSalary],
                    ["Bonus", record.bonus],
                    ["Deductions", record.deductions],
                    ["Net Salary", record.netSalary],
                  ].map(([label, amount]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p
                        className={`mt-1 break-all text-sm font-semibold ${
                          label === "Net Salary"
                            ? "text-indigo-700"
                            : "text-slate-900"
                        }`}
                      >
                        {money(amount)}
                      </p>
                    </div>
                  ))}
                </div>

                {isAdmin && isPending(record.status) && (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(record._id)}
                    disabled={Boolean(processingId)}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {processingId === record._id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    Mark as Paid
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-14">
            <Loader2 size={23} className="animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading payroll records...</p>
          </div>
        )}

        {!loading && filteredRecords.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Wallet size={23} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              No payroll records found
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              {search
                ? "Try another name, month, or status."
                : "Payroll records will appear here."}
            </p>
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {showModal && isAdmin && (
          <motion.div
            key="payroll-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="payroll-modal-title"
              className="flex max-h-[90dvh] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <IndianRupee size={20} />
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="payroll-modal-title"
                      className="text-base font-bold text-slate-900 sm:text-lg"
                    >
                      Generate Payroll
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Create a monthly salary record
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close payroll form"
                  className="flex h-8 w-8 shrink-0 items-center cursor-pointer justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={handleGenerate}
                noValidate
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 no-scrollbar"
              >
                <FormField
                  label="Select Employee"
                  error={formErrors.employeeId}
                >
                  <div className="relative">
                    <Users
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      required
                      value={form.employeeId}
                      onChange={(event) =>
                        updateForm("employeeId", event.target.value)
                      }
                      aria-invalid={Boolean(formErrors.employeeId)}
                      className={`${inputClass(formErrors.employeeId)} pl-10`}
                    >
                      <option value="">Choose an employee</option>

                      {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name} — {employee.department || "Employee"}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <FormField label="Payroll Month" error={formErrors.month}>
                  <input
                    type="month"
                    required
                    value={form.month}
                    max={currentMonth()}
                    onChange={(event) =>
                      updateForm("month", event.target.value)
                    }
                    aria-invalid={Boolean(formErrors.month)}
                    className={inputClass(formErrors.month)}
                  />
                </FormField>

                <FormField label="Basic Salary">
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900">
                    {money(baseSalary)}
                  </div>
                </FormField>

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Bonus (₹)" error={formErrors.bonus}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.bonus}
                      maxLength={12}
                      onChange={(event) =>
                        handleMoneyChange("bonus", event.target.value)
                      }
                      placeholder="0.00"
                      aria-invalid={Boolean(formErrors.bonus)}
                      className={inputClass(formErrors.bonus)}
                    />
                  </FormField>

                  <FormField
                    label="Deductions (₹)"
                    error={formErrors.deductions}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.deductions}
                      maxLength={12}
                      onChange={(event) =>
                        handleMoneyChange("deductions", event.target.value)
                      }
                      placeholder="0.00"
                      aria-invalid={Boolean(formErrors.deductions)}
                      className={inputClass(formErrors.deductions)}
                    />
                  </FormField>
                </div>

                <motion.div
                  layout
                  className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-indigo-600">
                        Calculated Net Salary
                      </p>

                      <motion.p
                        key={calculatedSalary}
                        initial={reduced ? false : { opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 break-all text-2xl font-bold text-indigo-900"
                      >
                        {money(calculatedSalary)}
                      </motion.p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
                      <IndianRupee size={21} />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-indigo-600">
                    Basic Salary + Bonus − Deductions
                  </p>
                </motion.div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SUBMIT */}
                <motion.button
                  type="submit"
                  disabled={saving || !form.employeeId}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Generate Payroll
                    </>
                  )}
                </motion.button>

                <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>
                    Review salary details before generating the payroll record.
                  </span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
