import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@str-certified/database"
import { compare } from "bcryptjs"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "INSPECTOR",
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = credentialsSchema.safeParse(credentials)
        if (!result.success) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: result.data.email },
          include: { organization: true },
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(result.data.password, user.passwordHash)
        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }

      // Handle Google OAuth sign in
      if (account?.provider === "google" && user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!dbUser) {
          // Create organization for new Google users
          const org = await prisma.organization.create({
            data: {
              name: `${user.name}'s Organization`,
              slug: user.email!.split('@')[0] + '-' + Date.now(),
            },
          })

          // Create user
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: "INSPECTOR",
              organizationId: org.id,
              emailVerified: new Date(),
            },
          })

          token.id = newUser.id
          token.role = newUser.role
          token.organizationId = newUser.organizationId
        } else {
          token.id = dbUser.id
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
}