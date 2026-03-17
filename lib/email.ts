/**
 * FILE: lib/email.ts
 *
 * Install dependency first:
 *   npm install nodemailer
 *   npm install --save-dev @types/nodemailer
 *
 * Add these to your .env.local:
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=your-app-password        ← Gmail: use App Password, not your real password
 *   EMAIL_FROM="StudySync <your@gmail.com>"
 *   NEXTAUTH_URL=http://localhost:3000   ← already set for NextAuth, used for login link
 */

import nodemailer from 'nodemailer'
import { getDaysLeft } from './dateUtils'

// ── Transporter (singleton) ───────────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  return transporter
}

// ── Base HTML layout ──────────────────────────────────────────────────────────

function baseLayout(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>StudySync</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border:1px solid #c8b89a;border-radius:4px;
                 box-shadow:4px 4px 0 #c8b89a;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1a3a2a;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;letter-spacing:1px;">
                      <span style="color:#ffffff;">Study</span><span style="color:#d4a843;">Sync</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="color:rgba(250,246,238,0.35);font-family:monospace;font-size:10px;
                                 letter-spacing:2px;text-transform:uppercase;">
                      Notification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf6ee;border-top:1px solid #f0e9d6;padding:16px 32px;">
              <p style="margin:0;font-family:monospace;font-size:10px;color:#a89880;
                        text-align:center;letter-spacing:1px;text-transform:uppercase;">
                StudySync · Automated Notification · Do not reply to this email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Shared components ─────────────────────────────────────────────────────────

function pill(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:3px;
    font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;
    text-transform:uppercase;color:${color};background:${bg};">${text}</span>`
}

function ctaButton(label: string, href: string): string {
  return `
  <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td style="background:#1a3a2a;border-radius:3px;border:1px solid rgba(212,168,67,0.4);">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:12px 28px;font-family:Georgia,serif;
                 font-size:13px;font-weight:700;color:#d4a843;text-decoration:none;
                 letter-spacing:0.5px;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f0e9d6;margin:20px 0;" />`
}

function infoRow(icon: string, label: string, value: string): string {
  return `
  <tr>
    <td style="padding:6px 0;font-family:monospace;font-size:11px;
               color:#7a6a52;text-transform:uppercase;letter-spacing:1px;width:130px;">
      ${icon} ${label}
    </td>
    <td style="padding:6px 0;font-family:Georgia,serif;font-size:13px;
               color:#1a1209;font-weight:600;">
      ${value}
    </td>
  </tr>`
}

const LOGIN_URL = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/login`

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — Student: New Project Assigned
// ══════════════════════════════════════════════════════════════════════════════

export interface NewProjectEmailData {
  studentName:  string
  projectTitle: string
  subjectName:  string
  subjectCode:  string
  deadline:     string   // formatted date string
  maxScore:     number
  description?: string
}

function buildNewProjectEmail(d: NewProjectEmailData): string {
  const statusInfo = getDaysLeft(d.deadline)

  return baseLayout(`
    <p style="margin:0 0 4px;font-family:monospace;font-size:11px;
               color:#1a7a6e;text-transform:uppercase;letter-spacing:2px;">
      New Assignment
    </p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;
               font-weight:900;color:#1a1209;line-height:1.3;">
      ${d.projectTitle}
    </h1>

    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;
               color:#4a3828;line-height:1.6;">
      Hi <strong>${d.studentName}</strong>, a new project has been assigned to you
      in <strong>${d.subjectName}</strong>.
    </p>

    ${d.description ? `
    <div style="background:#faf6ee;border-left:3px solid #d4a843;
                padding:12px 16px;border-radius:0 3px 3px 0;margin-bottom:20px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:13px;
                 color:#4a3828;line-height:1.6;font-style:italic;">
        ${d.description}
      </p>
    </div>` : ''}

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${infoRow('📚', 'Subject',   `${d.subjectCode} — ${d.subjectName}`)}
      ${infoRow('🏆', 'Max Score', `${d.maxScore} pts`)}
      ${infoRow('📅', 'Deadline',  `<span style="color:${statusInfo.color};font-weight:700;">
        ${new Date(d.deadline).toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' })}
        &nbsp;·&nbsp; ${statusInfo.label}
      </span>`)}
    </table>

    ${divider()}
    <p style="margin:0;font-family:monospace;font-size:11px;color:#a89880;">
      Log in to StudySync to view the full project details and submit your work.
    </p>
    ${ctaButton('View Project', LOGIN_URL)}
  `)
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — Student: Inactivity Reminder (3 days)
// ══════════════════════════════════════════════════════════════════════════════

export interface InactivityReminderData {
  studentName:    string
  daysSinceLogin: number
  pendingCount:   number   // number of unsubmitted projects
  pendingProjects: { title: string; subjectCode: string; deadline: string }[]
}

function buildInactivityEmail(d: InactivityReminderData): string {
  const rows = d.pendingProjects.slice(0, 5).map(p => {
    const statusInfo = getDaysLeft(p.deadline)
    return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e9d6;">
        <span style="font-family:monospace;font-size:10px;color:#c0392b;
                     font-weight:700;margin-right:8px;">${p.subjectCode}</span>
        <span style="font-family:Georgia,serif;font-size:13px;color:#1a1209;
                     font-weight:600;">${p.title}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e9d6;
                  text-align:right;white-space:nowrap;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;color:${statusInfo.color};">
          ${statusInfo.label}
        </span>
      </td>
    </tr>`
  }).join('')

  return baseLayout(`
    <p style="margin:0 0 4px;font-family:monospace;font-size:11px;
               color:#d4a843;text-transform:uppercase;letter-spacing:2px;">
      ⏰ Reminder
    </p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;
               font-weight:900;color:#1a1209;line-height:1.3;">
      You have pending projects
    </h1>

    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;
               color:#4a3828;line-height:1.6;">
      Hi <strong>${d.studentName}</strong>, you haven't logged into StudySync
      for <strong>${d.daysSinceLogin} day${d.daysSinceLogin !== 1 ? 's' : ''}</strong>.
      You have <strong style="color:#c0392b;">${d.pendingCount} unsubmitted project${d.pendingCount !== 1 ? 's' : ''}</strong>
      waiting for you.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #c8b89a;border-radius:3px;overflow:hidden;
             box-shadow:2px 2px 0 #e8dfc8;margin-bottom:20px;">
      <thead>
        <tr style="background:#f0e9d6;">
          <th style="padding:8px 12px;text-align:left;font-family:monospace;
                     font-size:10px;color:#7a6a52;text-transform:uppercase;
                     letter-spacing:1px;">Project</th>
          <th style="padding:8px 12px;text-align:right;font-family:monospace;
                     font-size:10px;color:#7a6a52;text-transform:uppercase;
                     letter-spacing:1px;">Deadline</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${d.pendingProjects.length > 5 ? `
    <p style="margin:0 0 20px;font-family:monospace;font-size:11px;color:#a89880;">
      + ${d.pendingProjects.length - 5} more project${d.pendingProjects.length - 5 !== 1 ? 's' : ''} not shown
    </p>` : ''}

    ${divider()}
    <p style="margin:0;font-family:monospace;font-size:11px;color:#a89880;">
      Don't let deadlines sneak up on you — log in and submit your work today.
    </p>
    ${ctaButton('Go to StudySync', LOGIN_URL)}
  `)
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Teacher: Student Submitted a Project
// ══════════════════════════════════════════════════════════════════════════════

export interface SubmissionNotifyData {
  teacherName:   string
  studentName:   string
  studentEmail:  string
  projectTitle:  string
  subjectName:   string
  subjectCode:   string
  submittedAt:   string   // ISO string
  isLate:        boolean
}

function buildSubmissionEmail(d: SubmissionNotifyData): string {
  return baseLayout(`
    <p style="margin:0 0 4px;font-family:monospace;font-size:11px;
               color:#1a7a6e;text-transform:uppercase;letter-spacing:2px;">
      📥 New Submission
    </p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;
               font-weight:900;color:#1a1209;line-height:1.3;">
      ${d.projectTitle}
    </h1>

    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;
               color:#4a3828;line-height:1.6;">
      Hi <strong>${d.teacherName}</strong>,
      a student has submitted their work for grading.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${infoRow('👤', 'Student',   `${d.studentName} &lt;${d.studentEmail}&gt;`)}
      ${infoRow('📚', 'Subject',   `${d.subjectCode} — ${d.subjectName}`)}
      ${infoRow('🗂', 'Project',   d.projectTitle)}
      ${infoRow('🕐', 'Submitted', new Date(d.submittedAt).toLocaleString('en-MY', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }))}
      ${infoRow('⏰', 'Status', d.isLate
        ? `<span style="color:#c0392b;font-weight:700;">Late submission</span>`
        : `<span style="color:#1a7a6e;font-weight:700;">On time</span>`
      )}
    </table>

    ${divider()}
    <p style="margin:0;font-family:monospace;font-size:11px;color:#a89880;">
      Click below to log in and grade this submission.
    </p>
    ${ctaButton('Grade Submission', LOGIN_URL)}
  `)
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4 — Admin: New Project Awaiting Approval
// ══════════════════════════════════════════════════════════════════════════════

export interface ProjectApprovalEmailData {
  adminName:    string
  teacherName:  string
  teacherEmail: string
  projectTitle: string
  subjectName:  string
  subjectCode:  string
  deadline:     string
  maxScore:     number
  description?: string
}

function buildProjectApprovalEmail(d: ProjectApprovalEmailData): string {
  return baseLayout(`
    <p style="margin:0 0 4px;font-family:monospace;font-size:11px;
               color:#d4a843;text-transform:uppercase;letter-spacing:2px;">
      🔔 Approval Required
    </p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;
               font-weight:900;color:#1a1209;line-height:1.3;">
      New project pending review
    </h1>

    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;
               color:#4a3828;line-height:1.6;">
      Hi <strong>${d.adminName}</strong>,
      a teacher has submitted a new project for your approval.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${infoRow('👤', 'Teacher',   `${d.teacherName} &lt;${d.teacherEmail}&gt;`)}
      ${infoRow('📚', 'Subject',   `${d.subjectCode} — ${d.subjectName}`)}
      ${infoRow('🗂', 'Project',   d.projectTitle)}
      ${infoRow('🏆', 'Max Score', `${d.maxScore} pts`)}
      ${infoRow('📅', 'Deadline',  new Date(d.deadline).toLocaleDateString('en-MY', {
        day: 'numeric', month: 'long', year: 'numeric',
      }))}
    </table>

    ${d.description ? `
    <div style="background:#faf6ee;border-left:3px solid #d4a843;
                padding:12px 16px;border-radius:0 3px 3px 0;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-family:monospace;font-size:10px;
                 color:#7a6a52;text-transform:uppercase;letter-spacing:1px;">
        Description
      </p>
      <p style="margin:0;font-family:Georgia,serif;font-size:13px;
                 color:#4a3828;line-height:1.6;font-style:italic;">
        ${d.description}
      </p>
    </div>` : ''}

    ${divider()}
    <p style="margin:0;font-family:monospace;font-size:11px;color:#a89880;">
      Log in to the admin portal to approve or reject this project.
    </p>
    ${ctaButton('Review Project', LOGIN_URL)}
  `)
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 5 — Admin: Password Changed
// ══════════════════════════════════════════════════════════════════════════════

export interface PasswordChangedEmailData {
  adminName:    string
  targetName:   string
  targetEmail:  string
  targetRole:   'teacher' | 'student' | 'admin'
  changedAt:    string   // ISO string
  changedBy:    string   // name of whoever triggered the change
}

function buildPasswordChangedEmail(d: PasswordChangedEmailData): string {
  const roleColor: Record<string, string> = {
    teacher: '#1a7a6e', student: '#63b3ed', admin: '#c0392b',
  }
  return baseLayout(`
    <p style="margin:0 0 4px;font-family:monospace;font-size:11px;
               color:#c0392b;text-transform:uppercase;letter-spacing:2px;">
      🔐 Security Alert
    </p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;
               font-weight:900;color:#1a1209;line-height:1.3;">
      Password changed
    </h1>

    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;
               color:#4a3828;line-height:1.6;">
      Hi <strong>${d.adminName}</strong>,
      a user account password has been changed on StudySync.
      Please review the details below.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${infoRow('👤', 'User',       d.targetName)}
      ${infoRow('📧', 'Email',      d.targetEmail)}
      ${infoRow('🏷',  'Role',
        `<span style="color:${roleColor[d.targetRole] ?? '#1a1209'};
                      font-weight:700;text-transform:capitalize;">
          ${d.targetRole}
        </span>`
      )}
      ${infoRow('🕐', 'Changed at', new Date(d.changedAt).toLocaleString('en-MY', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }))}
      ${infoRow('✏️',  'Changed by', d.changedBy)}
    </table>

    <div style="background:rgba(192,57,43,0.05);border:1px solid rgba(192,57,43,0.2);
                border-radius:3px;padding:12px 16px;margin-bottom:20px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:13px;
                 color:#c0392b;line-height:1.6;">
        If this change was not authorised, please log in immediately and reset the password.
      </p>
    </div>

    ${divider()}
    ${ctaButton('Go to Admin Portal', LOGIN_URL)}
  `)
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC SEND FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

async function send(to: string | string[], subject: string, html: string) {
  const t = getTransporter()
  await t.sendMail({
    from:    process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
    to:      Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  })
}

/** Student: new project assigned */
export async function sendNewProjectEmail(to: string, data: NewProjectEmailData) {
  await send(to, `📚 New Project: ${data.projectTitle} — StudySync`, buildNewProjectEmail(data))
}

/** Student: inactivity reminder */
export async function sendInactivityReminder(to: string, data: InactivityReminderData) {
  await send(to, `⏰ Reminder: You have ${data.pendingCount} pending project${data.pendingCount !== 1 ? 's' : ''} — StudySync`, buildInactivityEmail(data))
}

/** Teacher: student submitted */
export async function sendSubmissionNotification(to: string, data: SubmissionNotifyData) {
  await send(to, `📥 New Submission: ${data.projectTitle} by ${data.studentName} — StudySync`, buildSubmissionEmail(data))
}

/** Admin: new project needs approval */
export async function sendProjectApprovalEmail(to: string | string[], data: ProjectApprovalEmailData) {
  await send(to, `🔔 Approval Needed: ${data.projectTitle} by ${data.teacherName} — StudySync`, buildProjectApprovalEmail(data))
}

/** Admin: password changed */
export async function sendPasswordChangedEmail(to: string | string[], data: PasswordChangedEmailData) {
  await send(to, `🔐 Security Alert: Password changed for ${data.targetName} — StudySync`, buildPasswordChangedEmail(data))
}