import { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export const authConfig: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.password) return null
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        
        if (!isPasswordValid) return null
        
        // Parse roles from JSON field
        let rolesArray: string[] = []
        if (user.roles) {
          try {
            const parsed = typeof user.roles === 'string' 
              ? JSON.parse(user.roles as string)
              : user.roles
            rolesArray = Array.isArray(parsed) ? parsed : [user.role]
          } catch {
            rolesArray = [user.role]
          }
        } else {
          rolesArray = [user.role]
        }
        
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || '',
          role: user.role,
          roles: rolesArray
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roles = user.roles || [user.role]
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.roles = token.roles as string[]
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
}
