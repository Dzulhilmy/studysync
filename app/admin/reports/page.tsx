"use client";

import RealTimeClock from "@/components/RealTimeClock";
import Link from "next/link";
import { useEffect, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Report {
  _id: string;
  month: number;
  year: number;
  teacherName: string;
  teacherEmail: string;
  submittedAt: string;
  summary: {
    totalSubjects: number;
    totalStudents: number;
    totalProjects: number;
    avgGrade: number | null;
    totalSubmissions: number;
    gradedSubmissions: number;
    lateSubmissions: number;
    notSubmitted: number;
  };
  subjects: {
    subjectId: string;
    name: string;
    code: string;
    studentCount: number;
    projects: {
      projectId: string;
      title: string;
      deadline: string;
      submitted: number;
      graded: number;
      late: number;
      totalStudents: number;
      avgGrade: number | null;
      highestGrade: number | null;
      lowestGrade: number | null;
      // optional: individual student rows if API provides them
      students?: {
        name: string;
        email: string;
        submittedAt: string | null;
        isLate: boolean;
        didSubmit: boolean;
      }[];
    }[];
  }[];
  remarks: string;
}

type BreakdownType = "ontime" | "late" | "notsubmitted";

// ── Row built purely from report data already in memory ──────────────────────
interface BreakdownRow {
  projectTitle: string;
  subjectCode: string;
  count: number;
  totalStudents: number;
  // individual students if available
  students?: { name: string; email: string; submittedAt: string | null }[];
}

function buildRows(report: Report, type: BreakdownType): BreakdownRow[] {
  return report.subjects.flatMap((subj) =>
    subj.projects.map((p) => {
      let count = 0;
      if (type === "ontime")       count = Math.max(0, p.submitted - p.late);
      else if (type === "late")    count = p.late;
      else                         count = Math.max(0, p.totalStudents - p.submitted);

      const students = p.students
        ? p.students.filter((s) => {
            if (type === "ontime")       return s.didSubmit && !s.isLate;
            if (type === "late")         return s.didSubmit && s.isLate;
            /* notsubmitted */           return !s.didSubmit;
          })
        : undefined;

      return {
        projectTitle: p.title,
        subjectCode:  subj.code,
        count,
        totalStudents: p.totalStudents,
        students,
      };
    })
  ).filter((r) => r.count > 0);
}

// ── Breakdown Modal ───────────────────────────────────────────────────────────
function BreakdownModal({
  type, report, onClose,
}: {
  type: BreakdownType;
  report: Report;
  onClose: () => void;
}) {
  const META: Record<BreakdownType, { label: string; dot: string; text: string; bg: string; border: string }> = {
    ontime:       { label: "On Time",       dot: "#1a7a6e", text: "#1a7a6e", bg: "rgba(26,122,110,0.06)",  border: "rgba(26,122,110,0.25)"  },
    late:         { label: "Late",          dot: "#d4a843", text: "#8b5a2b", bg: "rgba(212,168,67,0.06)",  border: "rgba(212,168,67,0.3)"   },
    notsubmitted: { label: "Not Submitted", dot: "#c0392b", text: "#c0392b", bg: "rgba(192,57,43,0.06)",   border: "rgba(192,57,43,0.25)"   },
  };
  const m = META[type];
  const rows = buildRows(report, type);
  const hasIndividuals = rows.some((r) => r.students && r.students.length > 0);

  // total count for this category
  const totalCount =
    type === "ontime"
      ? Math.max(0, report.summary.totalSubmissions - report.summary.lateSubmissions)
      : type === "late"
      ? report.summary.lateSubmissions
      : report.summary.notSubmitted ??
        Math.max(0, report.summary.totalStudents * report.summary.totalProjects - report.summary.totalSubmissions);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-lg max-h-[82vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#2c1810] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: m.dot }} />
            <div>
              <h2 className="text-[#d4a843] font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>
                {m.label}
              </h2>
              <p className="text-[rgba(250,246,238,0.4)] text-[10px] font-mono mt-0.5">
                {MONTHS[report.month - 1]} {report.year} · {report.teacherName}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[rgba(250,246,238,0.35)] hover:text-white transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">
                {type === "ontime" ? "✅" : type === "late" ? "⏰" : "📭"}
              </div>
              <p className="text-[#7a6a52] text-sm font-mono">
                No {m.label.toLowerCase()} submissions this period.
              </p>
            </div>
          ) : hasIndividuals ? (
            // ── If API returns individual student rows ─────────────────────
            <>
              <div className="px-5 py-2 bg-[#faf6ee] border-b border-[#f0e9d6] grid grid-cols-12 gap-2 text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider shrink-0">
                <span className="col-span-5">Student</span>
                <span className="col-span-4">Project</span>
                <span className="col-span-3 text-right">{type === "notsubmitted" ? "Status" : "Submitted"}</span>
              </div>
              <div className="divide-y divide-[#f0e9d6]">
                {rows.flatMap((row) =>
                  (row.students ?? []).map((s, si) => (
                    <div key={`${row.projectTitle}-${si}`}
                      className="px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-[#faf6ee]">
                      <div className="col-span-5 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold text-[#d4a843] shrink-0"
                          style={{ background: "#1a3a2a" }}>
                          {s.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#1a1209] truncate">{s.name}</div>
                          <div className="text-[10px] font-mono text-[#7a6a52] truncate">{s.email}</div>
                        </div>
                      </div>
                      <div className="col-span-4 text-xs text-[#4a3828] truncate">
                        <span className="text-[10px] font-mono text-[#c0392b] mr-1">{row.subjectCode}</span>
                        {row.projectTitle}
                      </div>
                      <div className="col-span-3 text-right">
                        {type === "notsubmitted" ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                            style={{ color: m.text, background: m.bg, border: `1px solid ${m.border}` }}>
                            Not submitted
                          </span>
                        ) : s.submittedAt ? (
                          <span className="text-[10px] font-mono text-[#7a6a52]">
                            {new Date(s.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                            style={{ color: m.text, background: m.bg, border: `1px solid ${m.border}` }}>
                            {type === "late" ? "Late" : "On time"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // ── Fallback: per-project summary (always works from report data) ──
            <>
              <div className="px-5 pt-3 pb-1">
                <p className="text-[10px] font-mono text-[#a89880] italic">
                  Showing per-project counts from report data.
                  To see individual student names, ensure your API includes a <code className="bg-[#f0e9d6] px-1 rounded">students[]</code> array in each project.
                </p>
              </div>
              <div className="px-5 py-2 bg-[#faf6ee] border-y border-[#f0e9d6] grid grid-cols-12 gap-2 text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">
                <span className="col-span-2">Code</span>
                <span className="col-span-6">Project</span>
                <span className="col-span-2 text-center">Count</span>
                <span className="col-span-2 text-right">of Total</span>
              </div>
              <div className="divide-y divide-[#f0e9d6]">
                {rows.map((row, i) => (
                  <div key={i} className="px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-[#faf6ee]">
                    <div className="col-span-2">
                      <span className="text-[10px] font-mono font-bold text-[#c0392b]">{row.subjectCode}</span>
                    </div>
                    <div className="col-span-6 text-sm font-semibold text-[#1a1209] truncate"
                      style={{ fontFamily: "Georgia, serif" }}>
                      {row.projectTitle}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-lg font-bold" style={{ color: m.dot, fontFamily: "Georgia, serif" }}>
                        {row.count}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="w-full bg-[#f0e9d6] rounded-full h-1.5 overflow-hidden mt-0.5">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((row.count / row.totalStudents) * 100))}%`,
                            background: m.dot,
                            opacity: type === "notsubmitted" ? 0.6 : 1,
                          }} />
                      </div>
                      <span className="text-[10px] font-mono text-[#a89880]">
                        {Math.round((row.count / row.totalStudents) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f0e9d6] flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-[#7a6a52]">
            Total{" "}
            <strong className="text-[#1a1209]" style={{ fontFamily: "Georgia, serif" }}>{totalCount}</strong>
            {" "}
            <span className="lowercase">{m.label}</span>
          </span>
          <button onClick={onClose}
            className="text-xs px-4 py-1.5 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm font-mono transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [reports,   setReports]   = useState<Report[]>([]);
  const [selected,  setSelected]  = useState<Report | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [breakdown, setBreakdown] = useState<BreakdownType | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => { setReports(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handlePrint(r: Report) {
    const data = encodeURIComponent(JSON.stringify(r));
    window.open(`/teacher/reports/print?data=${data}`, "_blank");
  }

  const byTeacher = reports.reduce((acc: Record<string, Report[]>, r) => {
    if (!acc[r.teacherName]) acc[r.teacherName] = [];
    acc[r.teacherName].push(r);
    return acc;
  }, {});

  return (
    <div>
      {/* Breakdown modal — passes full report, zero extra fetch */}
      {breakdown && selected && (
        <BreakdownModal
          type={breakdown}
          report={selected}
          onClose={() => setBreakdown(null)}
        />
      )}

      <Link href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#4a3828] hover:text-[#1a1209] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform inline-block">←</span>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: "Georgia, serif" }}>Monthly Reports</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Review submitted monthly reports from all teachers.</p>
        <RealTimeClock accentColor="#d4a843" />
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-16 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-[#7a6a52] text-sm">No reports submitted yet.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Report list ── */}
          <div className="lg:col-span-2 space-y-5">
            {Object.entries(byTeacher).map(([teacher, teacherReports]) => (
              <div key={teacher}>
                <h2 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="text-base">👤</span> {teacher}
                </h2>
                <div className="space-y-2">
                  {teacherReports.map((r) => (
                    <button key={r._id}
                      onClick={() => { setSelected(r); setBreakdown(null); }}
                      className={`w-full text-left p-4 border rounded-sm transition-all ${
                        selected?._id === r._id
                          ? "bg-[#2c1810] border-[rgba(212,168,67,0.4)] shadow-[3px_3px_0_rgba(26,18,9,0.3)]"
                          : "bg-white border-[#c8b89a] hover:border-[#d4a843] shadow-[2px_2px_0_#c8b89a]"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-bold text-sm ${selected?._id === r._id ? "text-[#d4a843]" : "text-[#1a1209]"}`}
                            style={{ fontFamily: "Georgia, serif" }}>
                            {MONTHS[r.month - 1]} {r.year}
                          </div>
                          <div className={`text-xs font-mono mt-0.5 ${selected?._id === r._id ? "text-[rgba(250,246,238,0.4)]" : "text-[#7a6a52]"}`}>
                            Submitted {new Date(r.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-mono ${selected?._id === r._id ? "text-[rgba(212,168,67,0.6)]" : "text-[#7a6a52]"}`}>
                            {r.summary.totalSubjects} subj · {r.summary.totalStudents} students
                          </div>
                          <div className={`text-xs font-mono mt-0.5 ${selected?._id === r._id ? "text-[rgba(250,246,238,0.3)]" : "text-[#a89880]"}`}>
                            Avg: {r.summary.avgGrade ?? "—"}pts
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Report detail ── */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="bg-white border border-[#c8b89a] rounded-sm p-16 text-center shadow-[3px_3px_0_#c8b89a]">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-[#7a6a52] text-sm">Select a report to view its details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-[#1a1209]" style={{ fontFamily: "Georgia, serif" }}>
                    {MONTHS[selected.month - 1]} {selected.year} — {selected.teacherName}
                  </h2>
                  <button onClick={() => handlePrint(selected)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c8b89a] text-[#1a1209] text-xs font-semibold rounded-sm hover:bg-[#faf6ee] shadow-[2px_2px_0_#c8b89a] transition-all">
                    🖨️ Print / Save PDF
                  </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: "📚", value: selected.summary.totalSubjects,   label: "Subjects"  },
                    { icon: "👥", value: selected.summary.totalStudents,   label: "Students"  },
                    { icon: "📋", value: selected.summary.totalProjects,   label: "Projects"  },
                    { icon: "🏆", value: selected.summary.avgGrade ?? "—", label: "Avg Grade" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white border border-[#c8b89a] rounded-sm p-4 text-center shadow-[2px_2px_0_#c8b89a]">
                      <div className="text-xl mb-1">{k.icon}</div>
                      <div className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: "Georgia, serif" }}>{k.value}</div>
                      <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Submission breakdown */}
                <div className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[2px_2px_0_#c8b89a]">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider">
                      Student Submission Breakdown
                    </h3>
                    <span className="text-[10px] font-mono text-[#a89880] italic">Click a card to see details</span>
                  </div>
                  {(() => {
                    const s      = selected.summary;
                    const onTime = Math.max(0, s.totalSubmissions - s.lateSubmissions);
                    const late   = s.lateSubmissions;
                    const notSub = s.notSubmitted ?? Math.max(0, (s.totalStudents * s.totalProjects) - s.totalSubmissions);
                    const total  = onTime + late + notSub || 1;
                    return (
                      <>
                        <div className="flex h-3 rounded-full overflow-hidden my-4 bg-[#f0e9d6]">
                          <div style={{ width: `${(onTime / total) * 100}%` }} className="bg-[#1a7a6e] transition-all" />
                          <div style={{ width: `${(late   / total) * 100}%` }} className="bg-[#d4a843] transition-all" />
                          <div style={{ width: `${(notSub / total) * 100}%` }} className="bg-[#c0392b] opacity-60 transition-all" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { label: "On Time",       value: onTime, type: "ontime"       as BreakdownType, numColor: "text-[#1a7a6e]", dot: "bg-[#1a7a6e]",            cardBorder: "border-[rgba(26,122,110,0.2)]",  cardBg: "bg-[rgba(26,122,110,0.05)]",  hover: "hover:bg-[rgba(26,122,110,0.1)] hover:border-[rgba(26,122,110,0.45)]"  },
                            { label: "Late",          value: late,   type: "late"         as BreakdownType, numColor: "text-[#8b5a2b]", dot: "bg-[#d4a843]",            cardBorder: "border-[rgba(212,168,67,0.25)]", cardBg: "bg-[rgba(212,168,67,0.05)]",  hover: "hover:bg-[rgba(212,168,67,0.12)] hover:border-[rgba(212,168,67,0.5)]" },
                            { label: "Not Submitted", value: notSub, type: "notsubmitted" as BreakdownType, numColor: "text-[#c0392b]", dot: "bg-[#c0392b] opacity-60", cardBorder: "border-[rgba(192,57,43,0.2)]",   cardBg: "bg-[rgba(192,57,43,0.04)]",   hover: "hover:bg-[rgba(192,57,43,0.1)] hover:border-[rgba(192,57,43,0.4)]"   },
                          ]).map((st) => (
                            <button key={st.label} onClick={() => setBreakdown(st.type)}
                              className={`rounded-sm p-3 border text-center transition-all cursor-pointer group ${st.cardBorder} ${st.cardBg} ${st.hover}`}>
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                <span className={`w-2 h-2 rounded-full inline-block ${st.dot}`} />
                                <span className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">{st.label}</span>
                              </div>
                              <div className={`text-2xl font-bold ${st.numColor}`} style={{ fontFamily: "Georgia,serif" }}>
                                {st.value}
                              </div>
                              <div className="text-[10px] font-mono text-[#a89880] mt-0.5">
                                {Math.round((st.value / total) * 100)}%
                              </div>
                              <div className="text-[10px] font-mono text-[#a89880] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View details →
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#f0e9d6] flex items-center justify-between text-xs font-mono text-[#7a6a52]">
                          <span>Total submissions: <strong className="text-[#1a1209]">{s.totalSubmissions}</strong></span>
                          <span>Graded: <strong className="text-[#1a7a6e]">{s.gradedSubmissions}</strong></span>
                          <span>Avg grade: <strong className="text-[#8b5a2b]">{s.avgGrade ?? "—"}pts</strong></span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Per-subject table */}
                {selected.subjects.map((subj) => (
                  <div key={subj.subjectId} className="bg-white border border-[#c8b89a] rounded-sm shadow-[2px_2px_0_#c8b89a] overflow-hidden">
                    <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-[#c0392b] font-bold">{subj.code}</span>
                        <span className="text-sm font-bold text-[#1a1209] ml-2" style={{ fontFamily: "Georgia, serif" }}>{subj.name}</span>
                      </div>
                      <span className="text-xs font-mono text-[#7a6a52]">{subj.studentCount} students</span>
                    </div>
                    {subj.projects.length === 0 ? (
                      <p className="px-4 py-3 text-xs font-mono text-[#7a6a52]">No projects this period.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-[#faf6ee] border-b border-[#f0e9d6]">
                            <tr>
                              {["Project", "Deadline", "Submitted", "Graded", "Late", "Avg", "High", "Low"].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-mono text-[#7a6a52] uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0e9d6]">
                            {subj.projects.map((p) => (
                              <tr key={p.projectId} className="hover:bg-[#faf6ee]">
                                <td className="px-3 py-2 font-semibold text-[#1a1209] max-w-[120px] truncate">{p.title}</td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] whitespace-nowrap">{new Date(p.deadline).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-mono">{p.submitted}/{p.totalStudents}</td>
                                <td className="px-3 py-2 font-mono text-[#1a7a6e] font-bold">{p.graded}</td>
                                <td className={`px-3 py-2 font-mono ${p.late > 0 ? "text-[#c0392b]" : ""}`}>{p.late}</td>
                                <td className="px-3 py-2 font-mono font-bold text-[#8b5a2b]">{p.avgGrade ?? "—"}</td>
                                <td className="px-3 py-2 font-mono">{p.highestGrade ?? "—"}</td>
                                <td className="px-3 py-2 font-mono">{p.lowestGrade ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {selected.remarks && (
                  <div className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[2px_2px_0_#c8b89a]">
                    <p className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2">Remarks</p>
                    <p className="text-sm text-[#1a1209] leading-relaxed italic">{selected.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}