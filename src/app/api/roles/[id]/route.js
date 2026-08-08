import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Role from "@/models/Role";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function PUT(req, { params }) {
  try {
    await requirePermission(PERMISSIONS.ROLE.MANAGE);
    await dbConnect();
    
    const { id } = await params;
    const body = await req.json();

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystemRole && body.name && body.name !== role.name) {
      return NextResponse.json({ error: "Cannot rename a system role" }, { status: 400 });
    }

    role.name = body.name || role.name;
    role.description = body.description !== undefined ? body.description : role.description;
    role.permissions = body.permissions || role.permissions;

    await role.save();

    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await requirePermission(PERMISSIONS.ROLE.MANAGE);
    await dbConnect();
    
    const { id } = await params;

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystemRole) {
      return NextResponse.json({ error: "Cannot delete a system role" }, { status: 400 });
    }

    // Optionally check if users are assigned to this role before deleting
    // const usersWithRole = await User.countDocuments({ role: id });
    // if (usersWithRole > 0) return error;

    await Role.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
