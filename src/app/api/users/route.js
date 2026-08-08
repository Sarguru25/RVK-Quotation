import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role"; // required for population
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET(req) {
  try {
    await requirePermission(PERMISSIONS.USER.VIEW);
    await dbConnect();
    
    // Search & filter params
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.isActive = status === 'Active';
    }

    // Role filtering would require populating or keeping roleString, we will use roleString or lookup
    const users = await User.find(query)
      .populate('role', 'name')
      .select('-password') // don't return passwords
      .sort({ createdAt: -1 });

    // Client side filtering for populated role if 'role' param is provided
    let filteredUsers = users;
    if (role) {
      filteredUsers = users.filter(u => (u.role?.name === role) || (u.roleString === role));
    }

    return NextResponse.json(filteredUsers);
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requirePermission(PERMISSIONS.USER.CREATE);
    await dbConnect();
    
    const body = await req.json();
    
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const user = await User.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.roleId || null,
      roleString: body.roleString || 'Employee',
      department: body.department || 'General',
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({ success: true, user: userObj });
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}