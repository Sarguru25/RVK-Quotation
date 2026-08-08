import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Quotation from "@/models/Quotation";
import User from "@/models/User";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Role-based filtering
    let filter = {};
    if (session.user.role === "Employee") {
      filter.userId = session.user.id;
    } else if (session.user.role === "Manager") {
      // Find all employees managed by this manager
      const employees = await User.find({ managerId: session.user.id }).select("_id");
      const employeeIds = employees.map(emp => emp._id);
      
      // Manager can see their own quotes AND their team's quotes
      filter.$or = [
        { userId: session.user.id },
        { userId: { $in: employeeIds } }
      ];
    }
    // Admin sees all (no filter)

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    if (search) {
      filter.$or = filter.$or || [];
      // Combine search condition with existing $or if any
      const searchCondition = { customerName: { $regex: search, $options: 'i' } };
      
      if (filter.$or.length > 0) {
          filter.$and = [{ $or: filter.$or }, searchCondition];
          delete filter.$or;
      } else {
          filter.$or.push(searchCondition);
      }
    }

    if (status) {
      filter.status = status;
    }

    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("GET Quotations Error:", error);
    return NextResponse.json({ message: "Error fetching quotations" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const body = await req.json();
    const { customerName, items, notes } = body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    // Calculate total
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const total = Number(item.quantity) * Number(item.rate);
      totalAmount += total;
      return {
        itemName: item.itemName,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        total
      };
    });

    const newQuotation = await Quotation.create({
      userId: session.user.id,
      customerName,
      items: processedItems,
      totalAmount,
      notes,
      status: "Draft"
    });

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error) {
    console.error("POST Quotation Error:", error);
    return NextResponse.json({ message: "Error creating quotation" }, { status: 500 });
  }
}