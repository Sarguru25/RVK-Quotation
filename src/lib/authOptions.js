import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role"; // Ensure Role model is imported

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "m@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        await dbConnect();
        
        // Populate role to get permissions
        const user = await User.findOne({ email: credentials.email }).populate('role');
        if (!user) {
          throw new Error("No user found with this email");
        }
        
        if (!user.isActive) {
          throw new Error("User account is disabled");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        let userPermissions = [];
        let roleName = user.roleString || "Executive";

        if (user.role) {
          roleName = user.role.name;
          userPermissions = [...user.role.permissions];
        }

        // Add user specific permissions overrides if any
        if (user.permissions && user.permissions.length > 0) {
          userPermissions = [...new Set([...userPermissions, ...user.permissions])];
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: roleName,
          permissions: userPermissions,
          department: user.department,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions || [];
        session.user.department = token.department;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  }
};
