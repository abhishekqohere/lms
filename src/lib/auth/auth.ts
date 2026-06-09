import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await dbConnect();
        const user = await User.findOne({
          email: parsed.data.email,
          isDeleted: false,
        }).select("+password");

        if (!user) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!isValid) return null;

        if (user.role === "instructor" && !user.isApproved) {
          throw new Error("Instructor account pending approval");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
});


// import NextAuth from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import dbConnect from "@/lib/db/mongodb";
// import User from "@/models/User";
// import { authConfig } from "./auth.config";
// import { loginSchema } from "@/lib/validations/auth";

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   ...authConfig,

//   providers: [
//     Credentials({
//       name: "credentials",

//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },

//       async authorize(credentials) {
//         const parsed = loginSchema.safeParse(credentials);
//         if (!parsed.success) return null;

//         await dbConnect();

//         const user = await User.findOne({
//           email: parsed.data.email,
//           isDeleted: false,
//         }).select("+password");

//         if (!user) return null;

//         const isValid = await bcrypt.compare(
//           parsed.data.password,
//           user.password
//         );

//         if (!isValid) return null;

//         // ❌ OLD (bad: throws error and breaks login)
//         // if (user.role === "instructor" && !user.isApproved) {
//         //   throw new Error("Instructor account pending approval");
//         // }

//         // ✅ NEW: allow login but mark status
//         const isBlockedInstructor =
//           user.role === "instructor" && !user.isApproved;

//         if (isBlockedInstructor) {
//           // still return user but flag it
//           return {
//             id: user._id.toString(),
//             email: user.email,
//             name: user.name,
//             role: user.role,
//             image: user.avatar,
//             isApproved: false,
//           } as any;
//         }

//         return {
//           id: user._id.toString(),
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           image: user.avatar,
//           isApproved: true,
//         } as any;
//       },
//     }),
//   ],
// });