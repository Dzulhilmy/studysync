"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";
import Avatar from "@/components/Avatar";
import { IconAdd, IconClose } from "@/components/NavIcons";

interface User {
  _id:       string;
  name:      string;
  email:     string;
  role:      string;
  class?:    string | null;
  isActive:  boolean;
  avatarUrl?: string | null;
  lastLogin?: string;
  createdAt: string;
}

const CLASSES = ["5 Chempaka", "5 Tulip", "5 Kasturi"];
const EMPTY_FORM = { name: "", email: "", password: "", role: "student", class: "" };
const FILTER_UNASSIGNED = "__none__";

const roleColor: Record<string, string> = {
  admin:   "text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.25)]",
  teacher: "text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]",
  student: "text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]",
};

const classColor: Record<string, string> = {
  "5 Chempaka": "text-[#1a4a8a] bg-[rgba(26,74,138,0.08)] border-[rgba(26,74,138,0.25)]",
  "5 Tulip":    "text-[#7a1a8a] bg-[rgba(122,26,138,0.08)] border-[rgba(122,26,138,0.25)]",
  "5 Kasturi":  "text-[#8a4a1a] bg-[rgba(138,74,26,0.08)] border-[rgba(138,74,26,0.25)]",
};

function ClassBadge({ cls }: { cls?: string | null }) {
  if (!cls) return <span className="text-xs font-mono text-[#b0a090]">—</span>;
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${classColor[cls] ?? "text-[#4a3828] bg-[#f0e9d6] border-[#c8b89a]"}`}>
      {cls}
    </span>
  );
}

export default function UsersPage() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Register form ────────────────────────────────────────────────────────
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  // ── Profile popup ────────────────────────────────────────────────────────
  const [popupUser,  setPopupUser]  = useState<User | null>(null);

  // ── Edit modal ───────────────────────────────────────────────────────────
  const [editUser,   setEditUser]   = useState<User | null>(null);
  const [editForm,   setEditForm]   = useState({ name: "", class: "", role: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState("");

  // ── Delete confirmation popup ────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────
  async function loadUsers() {
    const res  = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterRole, filterClass]);

  // ── Register ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setSubmitting(true);
    const res  = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setFormError(data.error); return; }
    setForm(EMPTY_FORM); setShowForm(false); loadUsers();
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async function toggleActive(user: User) {
    await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    // Update local state instantly so UI responds without full reload
    setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
    if (popupUser?._id === user._id) setPopupUser(p => p ? { ...p, isActive: !p.isActive } : p);
  }

  // ── Edit save ─────────────────────────────────────────────────────────────
  function openEdit(user: User) {
    setEditUser(user);
    setEditForm({ name: user.name, class: user.class ?? "", role: user.role });
    setEditError("");
  }

  async function saveEdit() {
    if (!editUser) return;
    setEditSaving(true); setEditError("");
    const res = await fetch(`/api/admin/users/${editUser._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:  editForm.name.trim(),
        class: editForm.class || null,
        role:  editForm.role,
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) { setEditError(data.error ?? "Failed to save."); return; }
    setUsers(prev => prev.map(u => u._id === editUser._id
      ? { ...u, name: editForm.name.trim(), class: editForm.class || null, role: editForm.role }
      : u
    ));
    if (popupUser?._id === editUser._id)
      setPopupUser(p => p ? { ...p, name: editForm.name.trim(), class: editForm.class || null, role: editForm.role } : p);
    setEditUser(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteTarget._id}`, { method: "DELETE" });
    setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
    if (popupUser?._id === deleteTarget._id) setPopupUser(null);
    setDeleteTarget(null);
    setDeleting(false);
  }

  // ── Filter + paginate ─────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole  = filterRole === "all" || u.role === filterRole;
    const matchClass =
      filterClass === "all"             ? true
      : filterClass === FILTER_UNASSIGNED ? !u.class
      : u.class === filterClass;
    return matchSearch && matchRole && matchClass;
  });

  const totalPages     = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex     = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Link href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#1a1209] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      {/* ── Profile popup ──────────────────────────────────────────────────── */}
      {popupUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPopupUser(null)}>
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[6px_6px_0_#c8b89a] w-72 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#2c1810] px-5 py-4 flex items-center justify-between">
              <span className="text-[#d4a843] text-xs font-mono uppercase tracking-wider">User Profile</span>
              <button onClick={() => setPopupUser(null)}
                className="text-[rgba(250,246,238,0.35)] hover:text-white transition-colors">
                <IconClose size={15} color="currentColor" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-3 border-b border-[#f0e9d6]">
              <Avatar src={popupUser.avatarUrl} name={popupUser.name} role={popupUser.role as any} size={80} showRoleDot />
              <div className="text-center">
                <div className="font-serif font-bold text-[#1a1209] text-base">{popupUser.name}</div>
                <div className="text-xs text-[#7a6a52] font-mono mt-0.5">{popupUser.email}</div>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm capitalize ${roleColor[popupUser.role]}`}>
                    {popupUser.role}
                  </span>
                  {popupUser.class && <ClassBadge cls={popupUser.class} />}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 space-y-1.5 border-b border-[#f0e9d6]">
              {[
                ["Class",      popupUser.class ?? "—"],
                ["Status",     popupUser.isActive ? "● Active" : "○ Inactive"],
                ["Joined",     new Date(popupUser.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })],
                ...(popupUser.lastLogin ? [["Last login", new Date(popupUser.lastLogin).toLocaleDateString("en-MY", { day: "numeric", month: "short" })]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs font-mono">
                  <span className="text-[#a89880]">{label}</span>
                  <span className={label === "Status" ? (popupUser.isActive ? "text-[#1a7a6e] font-bold" : "text-[#c0392b]") : "text-[#4a3828]"}>{value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 flex gap-2">
              <button onClick={() => { openEdit(popupUser); setPopupUser(null); }}
                className="flex-1 text-xs py-2 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors font-mono">
                Edit
              </button>
              <button onClick={() => toggleActive(popupUser)}
                className="flex-1 text-xs py-2 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors font-mono">
                {popupUser.isActive ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => { setDeleteTarget(popupUser); setPopupUser(null); }}
                className="flex-1 text-xs py-2 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors font-mono">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditUser(null)}>
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#2c1810] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[#d4a843] text-xs font-mono uppercase tracking-wider">Edit User</div>
                <div className="text-[rgba(250,246,238,0.5)] text-[11px] font-mono mt-0.5">{editUser.email}</div>
              </div>
              <button onClick={() => setEditUser(null)} className="text-[rgba(250,246,238,0.35)] hover:text-white">
                <IconClose size={15} color="currentColor" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {editError && (
                <p className="text-[11px] font-mono text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                  {editError}
                </p>
              )}
              {/* Name */}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                  placeholder="Full name" />
              </div>
              {/* Role */}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Role</label>
                <select value={editForm.role}
                  onChange={e => setEditForm(p => ({ ...p, role: e.target.value, class: e.target.value === "admin" ? "" : p.class }))}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {/* Class */}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Class {editForm.role === "admin" && <span className="normal-case text-[10px] text-[#b0a090]">(N/A for admin)</span>}
                </label>
                <select value={editForm.class}
                  onChange={e => setEditForm(p => ({ ...p, class: e.target.value }))}
                  disabled={editForm.role === "admin"}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843] disabled:opacity-40 disabled:cursor-not-allowed">
                  <option value="">— No class —</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditUser(null)}
                  className="flex-1 py-2 border border-[#c8b89a] text-xs text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm font-mono">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={editSaving || !editForm.name.trim()}
                  className="flex-1 py-2 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors"
                  style={{ background: '#2c1810', color: '#d4a843', border: '1px solid rgba(212,168,67,0.3)' }}>
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation popup ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#c0392b] px-5 py-4 flex items-center justify-between rounded-t-sm">
              <span className="text-white text-xs font-mono font-bold uppercase tracking-wider">⚠ Delete User</span>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="text-white/60 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[rgba(192,57,43,0.04)] border border-[rgba(192,57,43,0.15)] rounded-sm">
                <Avatar src={deleteTarget.avatarUrl} name={deleteTarget.name} role={deleteTarget.role as any} size={40} />
                <div>
                  <div className="font-semibold text-[#1a1209] text-sm">{deleteTarget.name}</div>
                  <div className="text-[11px] font-mono text-[#7a6a52]">{deleteTarget.email}</div>
                </div>
              </div>
              <p className="text-sm text-[#1a1209]">
                Are you sure you want to delete this user? <span className="font-semibold text-[#c0392b]">This action cannot be undone.</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-2 border border-[#c8b89a] text-xs text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm font-mono disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors text-white"
                  style={{ background: '#c0392b', border: '1px solid rgba(192,57,43,0.4)' }}>
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Register modal ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-md">
            <div className="bg-[#2c1810] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#d4a843] font-serif font-bold">Register New User</h2>
              <button onClick={() => setShowForm(false)} className="text-[rgba(250,246,238,0.4)] hover:text-white">
                <IconClose size={16} color="currentColor" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                  {formError}
                </div>
              )}
              {[
                { label: "Full Name", key: "name",     type: "text",     ph: "e.g. Aisha Rahman"    },
                { label: "Email",     key: "email",    type: "email",    ph: "e.g. aisha@school.edu" },
                { label: "Password",  key: "password", type: "password", ph: "Min 6 characters"      },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    required
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Role</label>
                  <select value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value, class: "" }))}
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                    Class {form.role === "admin" && <span className="normal-case text-[10px] text-[#b0a090]">(N/A)</span>}
                  </label>
                  <select value={form.class}
                    onChange={e => setForm(prev => ({ ...prev, class: e.target.value }))}
                    disabled={form.role === "admin"}
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843] disabled:opacity-40 disabled:cursor-not-allowed">
                    <option value="">— No class —</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-[#2c1810] text-[#d4a843] text-sm font-semibold rounded-sm disabled:opacity-50">
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1a1209] font-serif">User Management</h1>
        <RealTimeClock accentColor="#d4a843" />
        <button onClick={() => { setShowForm(true); setFormError(""); }}
          className="flex items-center gap-2 bg-[#2c1810] text-[#d4a843] px-4 py-2 text-sm font-semibold
                     border border-[rgba(212,168,67,0.3)] hover:bg-[#3d2415] transition-colors rounded-sm
                     shadow-[2px_2px_0_rgba(26,18,9,0.3)]">
          <IconAdd size={14} color="#d4a843" /> Register User
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 border border-[#c8b89a] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]" />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-[#c8b89a] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="border border-[#c8b89a] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]">
          <option value="all">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          <option value={FILTER_UNASSIGNED}>Unassigned</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0e9d6] border-b border-[#c8b89a]">
                {["Name", "Email", "Role", "Class", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider
                    ${i === 1 ? "hidden sm:table-cell" : ""}
                    ${i === 3 ? "hidden lg:table-cell" : ""}
                    ${i === 4 ? "hidden md:table-cell" : ""}
                    ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-[#7a6a52] text-xs font-mono animate-pulse">Loading users...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[#7a6a52] text-sm">No users found.</td></tr>
              ) : paginatedUsers.map(user => {
                const inactive = !user.isActive;
                return (
                  <tr key={user._id}
                    className={`border-b border-[#f0e9d6] transition-colors
                      ${inactive ? "opacity-50 bg-[#f8f4ee]" : "hover:bg-[#faf6ee]"}`}>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => setPopupUser(user)}
                          className="shrink-0 hover:scale-110 transition-transform" title="View profile">
                          <Avatar src={user.avatarUrl} name={user.name} role={user.role as any} size={32} />
                        </button>
                        <span className={`font-semibold ${inactive ? "text-[#9a8a7a] line-through" : "text-[#1a1209]"}`}>
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[#7a6a52] hidden sm:table-cell">{user.email}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm capitalize ${roleColor[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <ClassBadge cls={user.class} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-mono ${user.isActive ? "text-[#1a7a6e]" : "text-[#c0392b]"}`}>
                        {user.isActive ? "● Active" : "○ Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit — always visible */}
                        <button onClick={() => openEdit(user)}
                          className="text-xs px-2 py-1 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors">
                          Edit
                        </button>

                        {/* Active → show Deactivate | Inactive → show Activate only */}
                        {user.isActive ? (
                          <button onClick={() => toggleActive(user)}
                            className="text-xs px-2 py-1 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => toggleActive(user)}
                            className="text-xs px-2 py-1 border border-[rgba(26,122,110,0.35)] hover:bg-[rgba(26,122,110,0.08)] rounded-sm text-[#1a7a6e] transition-colors font-semibold">
                            Activate
                          </button>
                        )}

                        {/* Delete — always visible */}
                        <button onClick={() => setDeleteTarget(user)}
                          className="text-xs px-2 py-1 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#f0e9d6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7a6a52] font-mono">
          <span>
            Showing {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filtered.length === 0}
              className="px-3 py-1.5 border border-[#c8b89a] rounded-sm hover:bg-[#f0e9d6] disabled:opacity-40 transition-colors">
              Prev
            </button>
            <span className="px-2">Page {totalPages === 0 ? 0 : currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || filtered.length === 0}
              className="px-3 py-1.5 border border-[#c8b89a] rounded-sm hover:bg-[#f0e9d6] disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}