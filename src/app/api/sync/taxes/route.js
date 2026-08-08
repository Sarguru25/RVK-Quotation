import { NextResponse } from 'next/server';
import { syncTaxes } from '@/lib/zoho-sync/syncTaxes';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const syncType = body.type || 'manual';
    
    const result = await syncTaxes(syncType);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Tax Sync API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
