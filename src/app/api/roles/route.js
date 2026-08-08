import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Role from "@/models/Role";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ROLE.MANAGE);
    await dbConnect();
    
    const roles = await Role.find({}).sort({ createdAt: 1 });
    return NextResponse.json(roles);
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requirePermission(PERMISSIONS.ROLE.MANAGE);
    await dbConnect();
    
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const existing = await Role.findOne({ name: body.name });
    if (existing) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
    }

    const role = await Role.create({
      name: body.name,
      description: body.description || "",
      permissions: body.permissions || [],
      isSystemRole: false
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
