"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
  };
  subjects: any[];
  remarks: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => {
        setReports(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handlePrint(r: Report) {
    const data = encodeURIComponent(JSON.stringify(r));
    window.open(`/teacher/reports/print?data=${data}`, "_blank");
  }

  // Group by teacher for easier scanning
  const byTeacher = reports.reduce((acc: Record<string, Report[]>, r) => {
    const key = r.teacherName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#4a3828] hover:text-[#1a1209] mb-6 group transition-colors"
      >
        <span
          className="text-base leading-none group-hover:-translate-x-1 transition-transform inline-block"
        >
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="mb-6">
        <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">
          レポート管理
        </p>
        <h1
          className="text-2xl font-bold text-[#1a1209]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Monthly Reports
        </h1>
        <p className="text-[#7a6a52] text-sm mt-1">
          Review submitted monthly reports from all teachers.
        </p>
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">
          Loading reports...
        </div>
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
                    <button
                      key={r._id}
                      onClick={() => setSelected(r)}
                      className={`w-full text-left p-4 border rounded-sm transition-all ${
                        selected?._id === r._id
                          ? "bg-[#2c1810] border-[rgba(212,168,67,0.4)] shadow-[3px_3px_0_rgba(26,18,9,0.3)]"
                          : "bg-white border-[#c8b89a] hover:border-[#d4a843] shadow-[2px_2px_0_#c8b89a]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className={`font-bold text-sm ${selected?._id === r._id ? "text-[#d4a843]" : "text-[#1a1209]"}`}
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {MONTHS[r.month - 1]} {r.year}
                          </div>
                          <div
                            className={`text-xs font-mono mt-0.5 ${selected?._id === r._id ? "text-[rgba(250,246,238,0.4)]" : "text-[#7a6a52]"}`}
                          >
                            Submitted{" "}
                            {new Date(r.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xs font-mono ${selected?._id === r._id ? "text-[rgba(212,168,67,0.6)]" : "text-[#7a6a52]"}`}
                          >
                            {r.summary.totalSubjects} subj ·{" "}
                            {r.summary.totalStudents} students
                          </div>
                          <div
                            className={`text-xs font-mono mt-0.5 ${selected?._id === r._id ? "text-[rgba(250,246,238,0.3)]" : "text-[#a89880]"}`}
                          >
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
                <p className="text-[#7a6a52] text-sm">
                  Select a report to view its details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="font-bold text-[#1a1209]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {MONTHS[selected.month - 1]} {selected.year} —{" "}
                    {selected.teacherName}
                  </h2>
                  <button
                    onClick={() => handlePrint(selected)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c8b89a] text-[#1a1209] text-xs font-semibold rounded-sm hover:bg-[#faf6ee] shadow-[2px_2px_0_#c8b89a] transition-all"
                  >
                    🖨️ Print / Save PDF
                  </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      icon: "📚",
                      value: selected.summary.totalSubjects,
                      label: "Subjects",
                    },
                    {
                      icon: "👥",
                      value: selected.summary.totalStudents,
                      label: "Students",
                    },
                    {
                      icon: "📋",
                      value: selected.summary.totalProjects,
                      label: "Projects",
                    },
                    {
                      icon: "🏆",
                      value: selected.summary.avgGrade ?? "—",
                      label: "Avg Grade",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="bg-white border border-[#c8b89a] rounded-sm p-4 text-center shadow-[2px_2px_0_#c8b89a]"
                    >
                      <div className="text-xl mb-1">{k.icon}</div>
                      <div
                        className="text-2xl font-bold text-[#1a1209]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {k.value}
                      </div>
                      <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submission stats */}
                <div className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[2px_2px_0_#c8b89a]">
                  <h3 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-3">
                    Submission Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        label: "Total Submissions",
                        value: selected.summary.totalSubmissions,
                        color: "text-[#1a1209]",
                      },
                      {
                        label: "Graded",
                        value: selected.summary.gradedSubmissions,
                        color: "text-[#1a7a6e]",
                      },
                      {
                        label: "Late",
                        value: selected.summary.lateSubmissions,
                        color: "text-[#c0392b]",
                      },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div
                          className={`text-2xl font-bold ${s.color}`}
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {s.value}
                        </div>
                        <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mt-0.5">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-subject */}
                {selected.subjects.map((subj: any) => (
                  <div
                    key={subj.subjectId}
                    className="bg-white border border-[#c8b89a] rounded-sm shadow-[2px_2px_0_#c8b89a] overflow-hidden"
                  >
                    <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-[#c0392b] font-bold">
                          {subj.code}
                        </span>
                        <span
                          className="text-sm font-bold text-[#1a1209] ml-2"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {subj.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#7a6a52]">
                        {subj.studentCount} students
                      </span>
                    </div>
                    {subj.projects.length === 0 ? (
                      <p className="px-4 py-3 text-xs font-mono text-[#7a6a52]">
                        No projects this period.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-[#faf6ee] border-b border-[#f0e9d6]">
                            <tr>
                              {[
                                "Project",
                                "Deadline",
                                "Submitted",
                                "Graded",
                                "Late",
                                "Avg",
                                "High",
                                "Low",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2 text-left font-mono text-[#7a6a52] uppercase tracking-wider whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0e9d6]">
                            {subj.projects.map((p: any) => (
                              <tr
                                key={p.projectId}
                                className="hover:bg-[#faf6ee]"
                              >
                                <td className="px-3 py-2 font-semibold text-[#1a1209] max-w-[120px] truncate">
                                  {p.title}
                                </td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] whitespace-nowrap">
                                  {new Date(p.deadline).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {p.submitted}/{p.totalStudents}
                                </td>
                                <td className="px-3 py-2 font-mono text-[#1a7a6e] font-bold">
                                  {p.graded}
                                </td>
                                <td
                                  className={`px-3 py-2 font-mono ${p.late > 0 ? "text-[#c0392b]" : ""}`}
                                >
                                  {p.late}
                                </td>
                                <td className="px-3 py-2 font-mono font-bold text-[#8b5a2b]">
                                  {p.avgGrade ?? "—"}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {p.highestGrade ?? "—"}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {p.lowestGrade ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Remarks */}
                {selected.remarks && (
                  <div className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[2px_2px_0_#c8b89a]">
                    <p className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2">
                      Remarks
                    </p>
                    <p className="text-sm text-[#1a1209] leading-relaxed italic">
                      {selected.remarks}
                    </p>
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
