import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { hasPermission } from "./permissions";
import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePermission(permission) {
  const session = await requireAuth();
  
  // Admin automatically gets full access in many systems, 
  // but here we check the permissions array explicitly or wildcard
  if (!hasPermission(session.user.permissions, permission) && session.user.role !== 'Admin') {
    throw new Error("Forbidden: Missing required permission");
  }
  
  return session;
}

// Reusable utility for API Routes
export async function withPermission(permission, handler) {
  return async (req, ctx) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!hasPermission(session.user.permissions, permission) && session.user.role !== 'Admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return await handler(req, ctx, session);
    } catch (error) {
      console.error(`Permission Error [${permission}]:`, error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}

export async function logActivity({ userId, action, module, description, metadata, req }) {
  try {
    await dbConnect();
    const ipAddress = req?.headers?.get('x-forwarded-for') || req?.ip || 'unknown';
    
    await ActivityLog.create({
      user: userId,
      action,
      module,
      description,
      metadata,
      ipAddress
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw, just log quietly
  }
}

// Ownership Rules
export function canEditQuotation(user, quotation) {
  if (user.role === 'Admin' || hasPermission(user.permissions, 'quotation.view_all')) {
    return true;
  }
  // If user is manager, they can edit team's quotations
  // This requires fetching user hierarchy which is better done in DB layer.
  // For basic ownership:
  if (quotation.createdBy === user.id) {
    return true;
  }
  return false;
}
