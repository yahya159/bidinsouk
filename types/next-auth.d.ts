import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    roles: string[]
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      roles: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    roles: string[]
  }
}
