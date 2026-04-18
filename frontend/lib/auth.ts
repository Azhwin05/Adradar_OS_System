import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthUser } from "@/types";

// Server-side: use API_URL (internal Docker hostname http://api:8000)
// Client-side fallback: NEXT_PUBLIC_API_URL (http://localhost:8000)
// This is critical — NextAuth authorize() runs server-side inside the container.
const SERVER_API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${SERVER_API_URL}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const { access_token } = (await res.json()) as { access_token: string };

        const meRes = await fetch(`${SERVER_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!meRes.ok) return null;

        const me = (await meRes.json()) as Omit<AuthUser, "accessToken">;
        // Return as plain object — next-auth stores it in the JWT via the jwt callback
        return { ...me, accessToken: access_token };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // `user` here is the object returned from `authorize` above
        const u = user as unknown as AuthUser;
        token.id = u.id;
        token.role = u.role;
        token.tenant_id = u.tenant_id;
        token.accessToken = u.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as unknown as { user: AuthUser };
      s.user.id = token.id as string;
      s.user.role = token.role as "admin" | "client";
      s.user.tenant_id = (token.tenant_id as string | null) ?? null;
      s.user.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
