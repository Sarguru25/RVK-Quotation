import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Quotation from '@/models/Quotation';
import Customer from '@/models/Customer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const customer = await Customer.findOne({
      $or: [
        { zoho_customer_id: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    }).lean();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const realZohoId = customer.zoho_customer_id;
    const mongoId = customer._id.toString();
    const searchIds = [id, mongoId, realZohoId].filter(Boolean);

    // Aggregate visits
    const totalVisits = 0;
    const lastVisit = null;

    // Aggregate quotations
    const quotations = await Quotation.find({ customer_id: realZohoId }).lean();
    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length;
    const pendingQuotations = quotations.filter(q => ['draft', 'sent'].includes(q.status)).length;
    const rejectedQuotations = quotations.filter(q => q.status === 'declined').length;

    // Recent Activities
    let activities = [];

    quotations.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 5).forEach(q => {
      activities.push({
        type: 'quotation',
        date: q.date || q.createdAt,
        title: `Quotation ${q.estimate_number}`,
        description: `Status: ${q.status}`,
        status: q.status,
        data: q
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivities = activities.slice(0, 10);

    const lastQuotation = quotations.length > 0 ? quotations.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0].date : null;

    return NextResponse.json({
      totalVisits,
      totalQuotations,
      acceptedQuotations,
      pendingQuotations,
      rejectedQuotations,
      lastVisit,
      lastQuotation,
      recentActivities
    });
  } catch (error) {
    console.error('Customer Analytics GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
