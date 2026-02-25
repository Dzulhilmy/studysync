"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "student" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editUser, setEditUser] = useState<User | null>(null);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    loadUsers();
  }

  async function toggleActive(user: User) {
    await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    loadUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleColor: Record<string, string> = {
    admin:
      "text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.25)]",
    teacher:
      "text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]",
    student:
      "text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]",
  };

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#1a1209] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">
            ユーザー管理
          </p>
          <h1 className="text-2xl font-bold text-[#1a1209] font-serif">
            User Management
          </h1>
        </div>
        <RealTimeClock accentColor="#d4a843" />
        <button
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className="flex items-center gap-2 bg-[#2c1810] text-[#d4a843] px-4 py-2 text-sm font-semibold border border-[rgba(212,168,67,0.3)] hover:bg-[#3d2415] transition-colors rounded-sm shadow-[2px_2px_0_rgba(26,18,9,0.3)]"
        >
          ＋ Register User
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 border border-[#c8b89a] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-[#c8b89a] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>
      {/* Register Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-md">
            <div className="bg-[#2c1810] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#d4a843] font-serif font-bold">
                Register New User
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[rgba(250,246,238,0.4)] hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                  {error}
                </div>
              )}
              {[
                {
                  label: "Full Name",
                  key: "name",
                  type: "text",
                  placeholder: "e.g. Aisha Rahman",
                },
                {
                  label: "Email",
                  key: "email",
                  type: "email",
                  placeholder: "e.g. aisha@school.edu",
                },
                {
                  label: "Password",
                  key: "password",
                  type: "password",
                  placeholder: "Min 6 characters",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    required
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-[#2c1810] text-[#d4a843] text-sm font-semibold rounded-sm disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0e9d6] border-b border-[#c8b89a]">
                <th className="text-left px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-mono text-[#7a6a52] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-[#7a6a52] text-xs font-mono animate-pulse"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-[#7a6a52] text-sm"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-[#f0e9d6] hover:bg-[#faf6ee] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-sm bg-[#f0e9d6] border border-[#c8b89a] flex items-center justify-center text-xs font-bold text-[#8b5a2b]">
                          {user.name[0]}
                        </div>
                        <span className="font-semibold text-[#1a1209]">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#7a6a52] hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 border rounded-sm capitalize ${roleColor[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs font-mono ${user.isActive ? "text-[#1a7a6e]" : "text-[#c0392b]"}`}
                      >
                        {user.isActive ? "● Active" : "○ Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(user)}
                          className="text-xs px-2 py-1 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-xs px-2 py-1 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#f0e9d6] text-xs text-[#7a6a52] font-mono">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
        </div>
      </div>
    </div>
  );
}
