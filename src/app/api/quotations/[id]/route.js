import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Quotation from "@/models/Quotation";
import User from "@/models/User";

async function hasAccess(session, quotation) {
  if (session.user.role === "Admin") return true;
  if (session.user.role === "Employee") {
    return quotation.userId.toString() === session.user.id;
  }
  if (session.user.role === "Manager") {
    if (quotation.userId.toString() === session.user.id) return true;
    const author = await User.findById(quotation.userId);
    return author && author.managerId && author.managerId.toString() === session.user.id;
  }
  return false;
}

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const quotation = await Quotation.findById(params.id);
    if (!quotation) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (!(await hasAccess(session, quotation))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const quotation = await Quotation.findById(params.id);
    if (!quotation) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (!(await hasAccess(session, quotation))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    // Process items and calculate total if items are provided
    if (body.items) {
      let totalAmount = 0;
      body.items = body.items.map(item => {
        const total = Number(item.quantity) * Number(item.rate);
        totalAmount += total;
        return {
          itemName: item.itemName,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          total
        };
      });
      body.totalAmount = totalAmount;
    }

    const updated = await Quotation.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const quotation = await Quotation.findById(params.id);
    if (!quotation) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (!(await hasAccess(session, quotation))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await Quotation.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}