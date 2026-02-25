import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from './db'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })

        if (!user) throw new Error('No account found with that email')
        if (!user.isActive) throw new Error('Your account has been deactivated')

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) throw new Error('Incorrect password')

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, attach role + id to token
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.avatar = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      // Expose role + id on the client session
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).avatar = token.avatar
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60,   // 8 hours absolute max (idle timeout handled client-side)
    updateAge: 60,            // refresh JWT every 60 s — lets idle detection work
  },

  // ── Security hardening ──────────────────────────────────────────────
  // Prevent the JWT cookie from being read by JS (httpOnly is NextAuth default)
  // useSecureCookies is auto-enabled in production (HTTPS)
  secret: process.env.NEXTAUTH_SECRET,
}
