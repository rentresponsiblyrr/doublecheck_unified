import { UserRole } from "~/lib/database"
import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
    organizationId: string
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    organizationId: string
  }
}