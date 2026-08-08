import { NextResponse } from 'next/server';
import { syncCustomers } from '@/lib/zoho-sync/syncCustomers';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const syncType = body.type || 'manual';
    
    const result = await syncCustomers(syncType);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Customer Sync API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
