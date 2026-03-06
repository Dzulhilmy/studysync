import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'admin' | 'teacher' | 'student'
      avatar?: string
      avatarUrl?: string
    } & DefaultSession['user']
    
  }

  interface User {
    role: 'admin' | 'teacher' | 'student'
    avatar?: string
    avatarUrl?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'admin' | 'teacher' | 'student'
    avatar?: string
    avatarUrl?: string
  }
}
