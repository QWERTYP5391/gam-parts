import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.townId = user.townId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as
          | "vehicle_owner"
          | "mechanic"
          | "dealer";
        session.user.townId = token.townId as number;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
