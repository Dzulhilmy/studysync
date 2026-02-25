"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: { name: string };
  subject: { name: string; code: string } | null;
  scope: string;
  isPinned: boolean;
  readBy: string[];
  createdAt: string;
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/student/announcements");
    setAnnouncements(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch("/api/student/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: id }),
    });
    load();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
    markRead(id);
  }

  const pinned = announcements.filter((a) => a.isPinned);
  const regular = announcements.filter((a) => !a.isPinned);
  const unread = announcements.filter((a) => a.readBy.length === 0).length;

  return (
    <div>
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-[#63b3ed] text-xs font-mono tracking-[0.2em] uppercase mb-1">
            お知らせ
          </p>
          <h1
            className="text-2xl font-bold text-[#1a1209]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Announcements
          </h1>
        </div>
        <RealTimeClock accentColor="#63b3ed" />
        {unread > 0 && (
          <span className="text-xs font-mono px-3 py-1 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-sm">
            {unread} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-[#7a6a52] text-sm">
            No announcements yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pinned, ...regular].map((a) => {
            const isExpanded = expanded === a._id;
            const isRead = a.readBy.length > 0;

            return (
              <div
                key={a._id}
                className={`bg-white border rounded-sm shadow-[3px_3px_0_#c8b89a] transition-all ${
                  a.isPinned
                    ? "border-[rgba(212,168,67,0.5)]"
                    : "border-[#c8b89a]"
                } ${!isRead ? "border-l-4 border-l-[#63b3ed]" : ""}`}
              >
                {/* Header row — click to expand */}
                <button
                  className="w-full text-left px-5 py-4 hover:bg-[#faf6ee] transition-colors"
                  onClick={() => toggleExpand(a._id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {a.isPinned && (
                          <span className="text-xs font-mono text-[#d4a843] bg-[rgba(212,168,67,0.1)] border border-[rgba(212,168,67,0.3)] px-2 py-0.5 rounded-sm">
                            📌 Pinned
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${
                            a.scope === "global"
                              ? "text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]"
                              : "text-[#63b3ed] bg-[rgba(99,179,237,0.06)] border-[rgba(99,179,237,0.2)]"
                          }`}
                        >
                          {a.scope === "global"
                            ? "🌐 School-wide"
                            : `📚 ${a.subject?.code}`}
                        </span>
                        {!isRead && (
                          <span className="text-xs font-mono text-[#63b3ed] font-bold">
                            ● New
                          </span>
                        )}
                      </div>
                      <h3
                        className="font-bold text-[#1a1209]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {a.title}
                      </h3>
                      <div className="flex gap-3 mt-1 text-xs text-[#7a6a52] font-mono">
                        <span>👤 {a.author?.name}</span>
                        <span>
                          📅 {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[#7a6a52] text-lg shrink-0 mt-1">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[#f0e9d6]">
                    <p className="text-sm text-[#1a1209] leading-relaxed mt-4 whitespace-pre-line">
                      {a.content}
                    </p>
                    {a.subject && (
                      <div className="mt-3 text-xs text-[#7a6a52] font-mono">
                        📚 Subject: {a.subject.name} ({a.subject.code})
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
