// ── Relevant callbacks section for lib/auth.ts ────────────────────────────────
// Add / replace the callbacks block in your existing authOptions.
// The key addition is reading avatarUrl from the DB on every session refresh
// so it survives page reloads.

import dbConnect from '@/lib/db'
import User from '@/models/User'

// Inside your NextAuth({ ... }) config:
const callbacks = {

  // 1. On sign-in: write id, role, and avatarUrl into the JWT token
  async jwt({ token, user, trigger, session }: any) {
    if (user) {
      // First sign-in — populate from the credentials provider return value
      token.id        = user.id
      token.role      = user.role
      token.avatarUrl = user.avatarUrl ?? null
    }

    // When the client calls update({ avatarUrl }) after upload,
    // NextAuth fires the jwt callback with trigger === 'update'.
    // Merge the new value into the token so it persists.
    if (trigger === 'update' && session?.avatarUrl !== undefined) {
      token.avatarUrl = session.avatarUrl
    }

    // On every token refresh also re-read from the database.
    // This ensures the avatar is correct even after a full page reload.
    if (token.id && trigger !== 'update') {
      try {
        await dbConnect()
        const dbUser = await User.findById(token.id).select('avatarUrl').lean() as any
        if (dbUser) token.avatarUrl = dbUser.avatarUrl ?? null
      } catch {
        // Non-fatal — token already has the last-known value
      }
    }

    return token
  },

  // 2. On session read: copy token fields onto session.user
  async session({ session, token }: any) {
    if (token) {
      session.user.id        = token.id        as string
      session.user.role      = token.role      as string
      session.user.avatarUrl = token.avatarUrl as string | null
    }
    return session
  },
}

export { callbacks }

// ─────────────────────────────────────────────────────────────────────────────
// FULL EXAMPLE — replace your existing authOptions export with this shape:
//
// export const authOptions: AuthOptions = {
//   providers: [ CredentialsProvider({ ... }) ],
//   session:   { strategy: 'jwt' },
//   callbacks: {
//     jwt:     callbacks.jwt,
//     session: callbacks.session,
//   },
//   pages: { signIn: '/login' },
// }