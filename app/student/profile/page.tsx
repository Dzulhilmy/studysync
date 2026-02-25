"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";

export default function StudentProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSuccess("Profile updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    await update({ name });
  }

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
      <RealTimeClock accentColor="#63b3ed" />
      <div className="mb-6">
        <p className="text-[#63b3ed] text-xs font-mono tracking-[0.2em] uppercase mb-1">
          プロフィール
        </p>
        <h1
          className="text-2xl font-bold text-[#1a1209]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Profile Management
        </h1>
      </div>

      <div className="max-w-lg">
        {/* Avatar card */}
        <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a] mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-sm bg-[#1a2535] border-2 border-[rgba(99,179,237,0.4)] flex items-center justify-center text-2xl font-bold text-[#63b3ed]">
            {session?.user?.name?.[0] ?? "S"}
          </div>
          <div>
            <div
              className="font-bold text-[#1a1209] text-lg"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {session?.user?.name}
            </div>
            <div className="text-xs font-mono text-[#63b3ed] bg-[rgba(99,179,237,0.08)] border border-[rgba(99,179,237,0.25)] px-2 py-0.5 rounded-sm inline-block mt-1">
              Student
            </div>
            <div className="text-xs text-[#7a6a52] mt-1">
              {session?.user?.email}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
          <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-6 py-3">
            <h2
              className="font-bold text-[#1a1209]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Edit Profile
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="text-[#1a7a6e] text-xs bg-[rgba(26,122,110,0.08)] border border-[rgba(26,122,110,0.2)] px-3 py-2 rounded-sm">
                ✓ {success}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed]"
              />
            </div>

            {/* Password section */}
            <div className="border-t border-[#f0e9d6] pt-4">
              <p className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-4">
                Change Password{" "}
                <span className="normal-case">
                  (leave blank to keep current)
                </span>
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Current Password",
                    value: currentPassword,
                    set: setCurrentPassword,
                    placeholder: "Enter current password",
                  },
                  {
                    label: "New Password",
                    value: newPassword,
                    set: setNewPassword,
                    placeholder: "Min 6 characters",
                  },
                  {
                    label: "Confirm Password",
                    value: confirmPassword,
                    set: setConfirmPassword,
                    placeholder: "Repeat new password",
                  },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                      {f.label}
                    </label>
                    <input
                      type="password"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#1a2535] text-[#63b3ed] text-sm font-semibold rounded-sm border border-[rgba(99,179,237,0.3)] hover:bg-[#243040] disabled:opacity-50 transition-colors shadow-[2px_2px_0_rgba(26,37,53,0.4)]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
