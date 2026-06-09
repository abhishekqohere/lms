import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/profile", "/instructor", "/admin", "/learn"];
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      if (nextUrl.pathname.startsWith("/admin") && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (
        nextUrl.pathname.startsWith("/instructor") &&
        auth?.user?.role !== "instructor" &&
        auth?.user?.role !== "admin"
      ) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    // jwt({ token, user }) {
    //   if (user) {
    //     token.id = user.id!;
    //     token.role = user.role;
    //     token.isApproved = (user as any).isApproved;
    //   }
    //   return token;
    // },
    
    // session({ session, token }) {
    //   if (session.user) {
    //     session.user.id = token.id;
    //     session.user.role = token.role;
    //     (session.user as any).isApproved = token.isApproved;
    //   }
    //   return session;
    // },
  },
  providers: [],
  session: { strategy: "jwt" },
};
