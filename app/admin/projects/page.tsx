"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";

interface Project {
  _id: string;
  title: string;
  description: string;
  subject: { name: string; code: string };
  createdBy: { name: string; email: string };
  deadline: string;
  maxScore: number;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending:
    "text-[#8b5a2b] bg-[rgba(212,168,67,0.1)] border-[rgba(212,168,67,0.3)]",
  approved:
    "text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]",
  rejected:
    "text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.25)]",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [reviewProject, setReviewProject] = useState<Project | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/projects");
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDecision(status: "approved" | "rejected") {
    if (!reviewProject) return;
    setSaving(true);
    await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewProject._id, status, adminNote: note }),
    });
    setSaving(false);
    setReviewProject(null);
    setNote("");
    load();
  }

  const filtered = projects.filter(
    (p) => filter === "all" || p.status === filter,
  );
  const counts = {
    all: projects.length,
    pending: projects.filter((p) => p.status === "pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    rejected: projects.filter((p) => p.status === "rejected").length,
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
      <div className="mb-6">
        <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">
          プロジェクト承認
        </p>
        <h1 className="text-2xl font-bold text-[#1a1209] font-serif">
          Project Approval
        </h1>
      </div>
      <RealTimeClock accentColor="#d4a843" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-all ${
              filter === f
                ? "bg-[#2c1810] text-[#d4a843] border-[rgba(212,168,67,0.4)]"
                : "bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#d4a843]"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Review modal */}
      {reviewProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-lg">
            <div className="bg-[#2c1810] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#d4a843] font-serif font-bold">
                Review Project
              </h2>
              <button
                onClick={() => setReviewProject(null)}
                className="text-[rgba(250,246,238,0.4)] hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-[#faf6ee] border border-[#c8b89a] rounded-sm">
                <div className="font-serif font-bold text-[#1a1209] mb-1">
                  {reviewProject.title}
                </div>
                <div className="text-xs text-[#7a6a52] mb-2">
                  {reviewProject.description}
                </div>
                <div className="flex gap-4 text-xs text-[#7a6a52] font-mono">
                  <span>
                    📚 {reviewProject.subject?.name} (
                    {reviewProject.subject?.code})
                  </span>
                  <span>👩‍🏫 {reviewProject.createdBy?.name}</span>
                </div>
                <div className="flex gap-4 text-xs text-[#7a6a52] font-mono mt-1">
                  <span>
                    📅 Due:{" "}
                    {new Date(reviewProject.deadline).toLocaleDateString()}
                  </span>
                  <span>🏆 Max score: {reviewProject.maxScore}</span>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Note to Teacher (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note explaining your decision..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDecision("rejected")}
                  disabled={saving}
                  className="flex-1 py-2.5 border border-[rgba(192,57,43,0.4)] text-[#c0392b] text-sm font-semibold hover:bg-[rgba(192,57,43,0.08)] rounded-sm disabled:opacity-50 transition-colors"
                >
                  ✕ Reject
                </button>
                <button
                  onClick={() => handleDecision("approved")}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#1a7a6e] text-white text-sm font-semibold hover:bg-[#155f56] rounded-sm disabled:opacity-50 transition-colors"
                >
                  ✓ Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">
          Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">🗂</div>
          <p className="text-[#7a6a52] text-sm">
            No {filter !== "all" ? filter : ""} projects found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p._id}
              className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[4px_4px_0_#c8b89a] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 border rounded-sm capitalize ${STATUS_STYLE[p.status]}`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs font-mono text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm">
                      {p.subject?.code}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-[#1a1209]">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#7a6a52] mt-1 line-clamp-1">
                    {p.description}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-[#7a6a52] font-mono flex-wrap">
                    <span>👩‍🏫 {p.createdBy?.name}</span>
                    <span>📚 {p.subject?.name}</span>
                    <span>📅 {new Date(p.deadline).toLocaleDateString()}</span>
                  </div>
                  {p.adminNote && (
                    <div className="mt-2 text-xs text-[#8b5a2b] bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.2)] px-2 py-1 rounded-sm">
                      💬 {p.adminNote}
                    </div>
                  )}
                </div>
                {p.status === "pending" && (
                  <button
                    onClick={() => {
                      setReviewProject(p);
                      setNote("");
                    }}
                    className="shrink-0 text-xs px-4 py-2 bg-[#2c1810] text-[#d4a843] border border-[rgba(212,168,67,0.3)] rounded-sm hover:bg-[#3d2415] transition-colors font-semibold"
                  >
                    Review →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
