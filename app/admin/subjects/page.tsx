"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";

interface Teacher {
  _id: string;
  name: string;
  email: string;
}
interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  teacher: Teacher | null;
  students: any[];
}

const EMPTY = { name: "", code: "", description: "", teacher: "" };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    const [sRes, uRes] = await Promise.all([
      fetch("/api/admin/subjects"),
      fetch("/api/admin/users"),
    ]);
    const subs = await sRes.json();
    const users = await uRes.json();
    setSubjects(subs);
    setTeachers(users.filter((u: any) => u.role === "teacher"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(s: Subject) {
    setEditId(s._id);
    setForm({
      name: s.name,
      code: s.code,
      description: s.description,
      teacher: s.teacher?._id ?? "",
    });
    setShowForm(true);
    setError("");
  }

  function openNew() {
    setEditId(null);
    setForm(EMPTY);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const url = editId
      ? `/api/admin/subjects/${editId}`
      : "/api/admin/subjects";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, teacher: form.teacher || null }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowForm(false);
    load();
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject?")) return;
    await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    load();
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">
            科目管理
          </p>
          <h1 className="text-2xl font-bold text-[#1a1209] font-serif">
            Subject Management
          </h1>
        </div>
        <RealTimeClock accentColor="#d4a843" />
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#2c1810] text-[#d4a843] px-4 py-2 text-sm font-semibold border border-[rgba(212,168,67,0.3)] hover:bg-[#3d2415] transition-colors rounded-sm shadow-[2px_2px_0_rgba(26,18,9,0.3)]"
        >
          ＋ New Subject
        </button>
      </div>
      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-md">
            <div className="bg-[#2c1810] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#d4a843] font-serif font-bold">
                {editId ? "Edit Subject" : "Create Subject"}
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
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Subject Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  placeholder="e.g. Mathematics"
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Subject Code
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  placeholder="e.g. MTH01"
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Brief description..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Assign Teacher
                </label>
                <select
                  value={form.teacher}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, teacher: e.target.value }))
                  }
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                >
                  <option value="">— No teacher assigned —</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
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
                  {submitting
                    ? "Saving..."
                    : editId
                      ? "Save Changes"
                      : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Subject cards */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[#7a6a52] text-sm">
            No subjects yet. Create your first subject above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <div
              key={s._id}
              className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[5px_5px_0_#c8b89a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs text-[#c0392b] bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm">
                  {s.code}
                </span>
                <span className="text-xs text-[#7a6a52] font-mono">
                  {s.students.length} student
                  {s.students.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-serif font-bold text-[#1a1209] text-base mb-1">
                {s.name}
              </h3>
              <p className="text-xs text-[#7a6a52] mb-3 line-clamp-2">
                {s.description || "No description."}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs">👩‍🏫</span>
                <span className="text-xs text-[#8b5a2b] font-semibold">
                  {s.teacher?.name ?? (
                    <span className="text-[#c8b89a] italic">Unassigned</span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="flex-1 text-xs py-1.5 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSubject(s._id)}
                  className="text-xs py-1.5 px-3 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
