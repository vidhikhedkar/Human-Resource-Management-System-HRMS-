import React, { useCallback, useEffect, useMemo, useState } from "react";
import {Users,UserPlus,Search,Pencil,UserX,X,RefreshCw,UserCheck,UserRoundX,LockKeyhole,Eye,EyeOff,Loader2,CheckCircle2,AlertCircle,ArrowUpRight,} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../services/api";


const createInitialForm = () => ({
  name: "",
  email: "",
  password: "",
  department: "",
  designation: "",
  salary: "",
  joiningDate: "",
});

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getArray = (data) => {
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

const emailRegex =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;
const nameRegex = /^[A-Za-z][A-Za-z .'-]*$/;
const textRegex = /^[A-Za-z][A-Za-z0-9 &()./-]*$/;
const passwordRegex = /^[^\s<>{}\[\]]{8,64}$/;


const fadeUp = (delay = 0, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    delay,
    ease: "easeOut",
  },
});


const SummaryCard = ({ title, value, icon: Icon, theme, index, loading }) => {
  const reduced = useReducedMotion();
  const themes = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      {...fadeUp(index * 0.07, reduced)}
      whileHover={reduced ? undefined : { y: -3 }}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${
            themes[theme] || themes.indigo
          }`}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <h3 className="mt-1 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
              {value}
            </h3>
          )}
        </div>

        <ArrowUpRight
          size={16}
          className="shrink-0 self-start text-slate-300"
        />
      </div>
    </motion.div>
  );
};


const FormField = ({ label, error, children, hint }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
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

const EmployeeStatus = ({ active }) => (
  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700"
    }`}
  >
    <span  className={`h-1.5 w-1.5 rounded-full ${
        active ? "bg-emerald-500" : "bg-rose-500"
      }`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);


export default function Employees() {
  const reduced = useReducedMotion();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const fetchEmployees = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/employees", {signal,});
      if (signal?.aborted) return;
      setEmployees(getArray(data));
    } catch (err) {
      if (signal?.aborted || err.code === "ERR_CANCELED") {
        return;
      }
      setError(err.response?.data?.message || "Unable to load employees.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [fetchEmployees]);


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


  const handleSearchChange = (event) => {
    const value = event.target.value;
    if (value.length > 60) {
      setSearchError("Maximum 60 characters allowed.");
      return;
    }

    const cleaned = value
      .replace(/[^a-zA-Z0-9@._+\- &()/]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");

    setSearch(cleaned);

    if (cleaned !== value) {
      setSearchError("Unsupported special characters are not allowed.");
    } else {
      setSearchError("");
    }
  };


  const handleInputChange = (field, value) => {
    let cleaned = value;
    switch (field) {
      case "name":
        cleaned = value.replace(/[^A-Za-z .'-]/g, "").slice(0, 60);
        break;

      case "email":
        cleaned = value.replace(/[^A-Za-z0-9@._%+-]/g, "").slice(0, 100);
        break;

      case "department":
      case "designation":
        cleaned = value.replace(/[^A-Za-z0-9 &()./-]/g, "").slice(0, 60);
        break;

      case "password":
        cleaned = value.replace(/[\s<>{}\[\]]/g, "").slice(0, 64);
        break;

      case "salary":
        if (!/^\d*\.?\d{0,2}$/.test(value)) return;
        if (value.length > 12) return;
        break;
      default:
        break;
    }
    setForm((previous) => ({
      ...previous,
      [field]: cleaned,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };


  const validateForm = () => {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const department = form.department.trim();
    const designation = form.designation.trim();
    if (!name) {
      errors.name = "Full name is required.";
    } else if (name.length < 2) {
      errors.name = "Name must have at least 2 characters.";
    } else if (!nameRegex.test(name)) {
      errors.name = "Enter a valid name.";
    }
    if (!email) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Enter a valid email address.";
    } else if (
      employees.some(
        (employee) =>
          employee.email?.toLowerCase() === email && employee._id !== editingId,
      )
    ) {
      errors.email = "This email address already exists.";
    }

    if (!department) {
      errors.department = "Department is required.";
    } else if (!textRegex.test(department)) {
      errors.department = "Enter a valid department.";
    }

    if (!designation) {
      errors.designation = "Designation is required.";
    } else if (!textRegex.test(designation)) {
      errors.designation = "Enter a valid designation.";
    }

    if (!form.salary) {
      errors.salary = "Monthly salary is required.";
    } else if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(form.salary)) {
      errors.salary = "Enter a valid non-negative salary (max 2 decimals).";
    }

    if (!form.joiningDate) {
      errors.joiningDate = "Joining date is required.";
    } else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.joiningDate) ||
      Number.isNaN(new Date(`${form.joiningDate}T00:00:00`).getTime())
    ) {
      errors.joiningDate = "Enter a valid joining date.";
    } else if (form.joiningDate > getToday()) {
      errors.joiningDate = "Joining date cannot be in the future.";
    }

    if (!editingId) {
      if (!form.password) {
        errors.password = "Password is required.";
      } else if (!passwordRegex.test(form.password)) {
        errors.password = "Use 8–64 characters without spaces or < > { } [ ].";
      } else if (
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/\d/.test(form.password)
      ) {
        errors.password = "Include uppercase, lowercase, and a number.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const openAddModal = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setFormErrors({});
    setShowPassword(false);
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setEditingId(employee._id);
    setFormErrors({});
    setShowPassword(false);
    setError("");
    setMessage("");

    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      department: employee.department || "",
      designation: employee.designation || "",
      salary: String(employee.salary ?? ""),
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().slice(0, 10)
        : "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setFormErrors({});
  };


  useEffect(() => {
    if (!showModal) return;
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        closeModal();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showModal, saving]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        salary: Number(form.salary),
        joiningDate: form.joiningDate,
      };
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        await api.post("/employees", {
          ...payload,
          password: form.password,
        });
      }

      const successMessage = editingId
        ? "Employee updated successfully."
        : "Employee created successfully.";
      setShowModal(false);
      setEditingId(null);
      setForm(createInitialForm());
      await fetchEmployees();
      setMessage(successMessage);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  };


  const handleDeactivate = async (employee) => {
    if (processingId) return;
    const confirmed = window.confirm(`Deactivate ${employee.name}'s account?`);
    if (!confirmed) return;
    try {
      setProcessingId(employee._id);
      setError("");
      setMessage("");
      await api.delete(`/employees/${employee._id}`);
      await fetchEmployees();
      setMessage("Employee deactivated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate employee.");
    } finally {
      setProcessingId(null);
    }
  };


  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) =>
      [
        employee.name,
        employee.email,
        employee.department,
        employee.designation,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [employees, search]);

  const activeCount = employees.filter((employee) => employee.isActive).length;
  const inactiveCount = employees.length - activeCount;

  const stats = [
    {
      title: "Total Employees",
      value: employees.length,
      icon: Users,
      theme: "indigo",
    },
    {
      title: "Active Employees",
      value: activeCount,
      icon: UserCheck,
      theme: "emerald",
    },
    {
      title: "Inactive Employees",
      value: inactiveCount,
      icon: UserRoundX,
      theme: "rose",
    },
  ];


  const inputClass = (field, hasIcon = false) =>
    `h-11 w-full min-w-0 rounded-xl border bg-white ${
      hasIcon ? "pl-10 pr-3" : "px-3.5" } 
      text-sm text-slate-800 outline-none transition-all focus:ring-4 ${
      formErrors[field]
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
              <Users size={16} />
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">
              HR Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Employee Management
          </h1>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Manage your team, employee details and workforce.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => fetchEmployees()}
            disabled={loading}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            className="inline-flex h-9 items-center justify-center gap-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </motion.button>

          <motion.button
            type="button"
            onClick={openAddModal}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            className="inline-flex h-9 items-center justify-center cursor-pointer gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <UserPlus size={15} />
            Add Employee
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {(message || (error && !showModal)) && (
          <motion.div
            key={error || message}
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
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="min-w-0">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
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

      <motion.section
        {...fadeUp(0.15, reduced)}
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Employee Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredEmployees.length} employees found
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
                maxLength={60}
                autoComplete="off"
                placeholder="Search employees..."
                aria-label="Search employees"
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
                  onClick={() => {
                    setSearch("");
                    setSearchError("");
                  }}
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

        <div className="hidden lg:block">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="w-[24%] px-3 py-3.5">Employee</th>
                <th className="w-[16%] px-3 py-3.5">Department</th>
                <th className="w-[17%] px-3 py-3.5">Designation</th>
                <th className="w-[16%] px-3 py-3.5">Salary</th>
                <th className="w-[13%] px-3 py-3.5">Status</th>
                <th className="w-[14%] px-3 py-3.5">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="min-w-0 px-3 py-4">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                          {employee.name?.charAt(0)?.toUpperCase() || "E"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {employee.name}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="truncate px-3 py-4 text-slate-600">
                      {employee.department || "--"}
                    </td>

                    <td className="truncate px-3 py-4 text-slate-600">
                      {employee.designation || "--"}
                    </td>

                    <td className="px-3 py-4 font-semibold text-slate-800">
                      {money(employee.salary)}
                    </td>

                    <td className="px-3 py-4">
                      <EmployeeStatus active={employee.isActive} />
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          whileTap={reduced ? undefined : { scale: 0.92 }}
                          aria-label={`Edit ${employee.name}`}
                          title="Edit employee"
                          className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          <Pencil size={15} />
                        </motion.button>

                        {employee.isActive && (
                          <motion.button
                            type="button"
                            onClick={() => handleDeactivate(employee)}
                            disabled={Boolean(processingId)}
                            whileTap={reduced ? undefined : { scale: 0.92 }}
                            aria-label={`Deactivate ${employee.name}`}
                            title="Deactivate employee"
                            className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            {processingId === employee._id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <UserX size={15} />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden">
            {filteredEmployees.map((employee) => (
              <motion.div
                key={employee._id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduced ? undefined : { y: -2 }}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-600">
                    {employee.name?.charAt(0)?.toUpperCase() || "E"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-slate-900">
                      {employee.name}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {employee.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <EmployeeStatus active={employee.isActive} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  {[
                    ["Department", employee.department || "--"],
                    ["Designation", employee.designation || "--"],
                    ["Salary", money(employee.salary)],
                    [
                      "Joining Date",
                      employee.joiningDate
                        ? String(employee.joiningDate).slice(0, 10)
                        : "--",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(employee)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  {employee.isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(employee)}
                      disabled={Boolean(processingId)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      {processingId === employee._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <UserX size={14} />
                      )}
                      Deactivate
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-14">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading employees...</p>
          </div>
        )}

        {!loading && filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Users size={23} />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              No employees found
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              {search
                ? "Try another name, department or designation."
                : "Add your first employee to get started."}
            </p>
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="employee-modal"
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
              aria-labelledby="employee-modal-title"
              className="flex max-h-[92dvh] w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {editingId ? <Pencil size={19} /> : <UserPlus size={19} />}
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="employee-modal-title"
                      className="text-base font-bold text-slate-900 sm:text-lg"
                    >
                      {editingId ? "Edit Employee" : "Add New Employee"}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {editingId
                        ? "Update employee information"
                        : "Create a new employee account"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close employee form"
                  className="flex h-8 w-8 shrink-0 items-center cursor-pointer justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 no-scrollbar"
              >
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Full Name" error={formErrors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        handleInputChange("name", event.target.value)
                      }
                      placeholder="Enter full name"
                      autoComplete="name"
                      maxLength={60}
                      aria-invalid={Boolean(formErrors.name)}
                      className={inputClass("name")}
                    />
                  </FormField>

                  <FormField label="Email Address" error={formErrors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleInputChange("email", event.target.value)
                      }
                      placeholder="name@company.com"
                      autoComplete="email"
                      maxLength={100}
                      aria-invalid={Boolean(formErrors.email)}
                      className={inputClass("email")}
                    />
                  </FormField>

                  <FormField label="Department" error={formErrors.department}>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(event) =>
                        handleInputChange("department", event.target.value)
                      }
                      placeholder="e.g. Engineering"
                      maxLength={60}
                      aria-invalid={Boolean(formErrors.department)}
                      className={inputClass("department")}
                    />
                  </FormField>

                  <FormField label="Designation" error={formErrors.designation}>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(event) =>
                        handleInputChange("designation", event.target.value)
                      }
                      placeholder="e.g. Software Developer"
                      maxLength={60}
                      aria-invalid={Boolean(formErrors.designation)}
                      className={inputClass("designation")}
                    />
                  </FormField>

                  <FormField
                    label="Monthly Salary (₹)"
                    error={formErrors.salary}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.salary}
                      onChange={(event) =>
                        handleInputChange("salary", event.target.value)
                      }
                      placeholder="Enter salary"
                      aria-invalid={Boolean(formErrors.salary)}
                      className={inputClass("salary")}
                    />
                  </FormField>

                  <FormField
                    label="Joining Date"
                    error={formErrors.joiningDate}
                  >
                    <input
                      type="date"
                      value={form.joiningDate}
                      max={getToday()}
                      onChange={(event) =>
                        handleInputChange("joiningDate", event.target.value)
                      }
                      aria-invalid={Boolean(formErrors.joiningDate)}
                      className={inputClass("joiningDate")}
                    />
                  </FormField>
                </div>

                {!editingId && (
                  <FormField
                    label="Employee Password"
                    error={formErrors.password}
                    hint="Minimum 8 characters with uppercase, lowercase and a number."
                  >
                    <div className="relative">
                      <LockKeyhole
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) =>
                          handleInputChange("password", event.target.value)
                        }
                        placeholder="Create employee password"
                        autoComplete="new-password"
                        maxLength={64}
                        aria-invalid={Boolean(formErrors.password)}
                        className={`${inputClass("password", true)} pr-11`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </FormField>
                )}

                <motion.button
                  type="submit"
                  disabled={saving}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <CheckCircle2 size={17} />
                      Update Employee
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Employee
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
