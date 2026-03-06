"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import RealTimeClock from "@/components/RealTimeClock";
import AvatarUploader from "@/components/AvatarUploader";
import { IconCheck } from "@/components/NavIcons";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name,            setName]            = useState(session?.user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving,          setSaving]          = useState(false);
  const [success,         setSuccess]         = useState("");
  const [error,           setError]           = useState("");

  // Track avatarUrl locally so the uploader reflects changes immediately
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (session?.user as any)?.avatarUrl ?? null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match."); return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters."); return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        currentPassword: currentPassword || undefined,
        newPassword:     newPassword     || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error); return; }

    setSuccess("Profile updated successfully!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    await update({ name });
  }

  return (
    <div>
      <Link href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#1a1209] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>
      <RealTimeClock accentColor="#d4a843" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1209] font-serif">Profile Management</h1>
      </div>

      <div className="max-w-lg space-y-4">

        {/* ── Avatar card — uses AvatarUploader ────────────────────────── */}
        <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a]">
          <p className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-4">
            Profile Photo
          </p>
          <AvatarUploader
            currentAvatar={avatarUrl}
            name={session?.user?.name}
            role="admin"
            onUpload={(url) => {
              setAvatarUrl(url || null);
              update(); // refresh session so sidebar avatar also updates
            }}
          />
        </div>

        {/* ── Info strip ───────────────────────────────────────────────── */}
        <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[2px_2px_0_#c8b89a]">
          <div className="font-serif font-bold text-[#1a1209] text-lg">
            {session?.user?.name}
          </div>
          <div className="text-xs font-mono text-[rgba(192,57,43,0.8)] bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm inline-block mt-1">
            Administrator
          </div>
          <div className="text-xs text-[#7a6a52] mt-1">{session?.user?.email}</div>
        </div>

        {/* ── Edit form ────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
          <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-6 py-3">
            <h2 className="font-serif font-bold text-[#1a1209]">Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="text-[#1a7a6e] text-xs bg-[rgba(26,122,110,0.08)] border border-[rgba(26,122,110,0.2)] px-3 py-2 rounded-sm flex items-center gap-1">
                <IconCheck size={12} color="#1a7a6e" /> {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
              />
            </div>

            <div className="border-t border-[#f0e9d6] pt-4">
              <p className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-4">
                Change Password <span className="normal-case">(leave blank to keep current)</span>
              </p>
              <div className="space-y-4">
                {[
                  { label: "Current Password",    val: currentPassword, set: setCurrentPassword, ph: "Enter current password" },
                  { label: "New Password",         val: newPassword,     set: setNewPassword,     ph: "Min 6 characters"       },
                  { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword, ph: "Repeat new password"    },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                      {f.label}
                    </label>
                    <input
                      type="password"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.ph}
                      className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#2c1810] text-[#d4a843] text-sm font-semibold rounded-sm
                         border border-[rgba(212,168,67,0.3)] hover:bg-[#3d2415] disabled:opacity-50
                         transition-colors shadow-[2px_2px_0_rgba(26,18,9,0.3)]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}