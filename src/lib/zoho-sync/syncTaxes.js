import dbConnect from '../db';
import Tax from '../../models/Tax';
import SyncLog from '../../models/SyncLog';
import { getTaxes } from '../zoho/taxes';

export async function syncTaxes(syncType = 'manual') {
  await dbConnect();
  
  const syncLog = await SyncLog.create({
    module: 'Taxes',
    sync_type: syncType,
    status: 'running'
  });

  try {
    const taxes = await getTaxes();
    
    let successCount = 0;
    let failedCount = 0;
    
    if (taxes.length > 0) {
      const bulkOps = taxes.map(tax => ({
        updateOne: {
          filter: { zoho_tax_id: tax.tax_id },
          update: {
            $set: {
              tax_name: tax.tax_name,
              tax_percentage: tax.tax_percentage,
              tax_type: tax.tax_type,
              is_value_added: tax.is_value_added,
              status: tax.status,
              created_time: tax.created_time ? new Date(tax.created_time) : null,
              last_modified_time: tax.last_modified_time ? new Date(tax.last_modified_time) : null,
              syncedAt: new Date(),
              rawZohoData: tax
            }
          },
          upsert: true
        }
      }));

      const result = await Tax.bulkWrite(bulkOps);
      successCount = result.upsertedCount + result.modifiedCount + (result.matchedCount - result.modifiedCount);
    }

    syncLog.status = 'completed';
    syncLog.records_processed = taxes.length;
    syncLog.success_count = successCount;
    syncLog.failed_count = failedCount;
    syncLog.completed_at = new Date();
    await syncLog.save();

    return { success: true, processed: taxes.length, log: syncLog };
  } catch (error) {
    syncLog.status = 'failed';
    syncLog.error_message = error.message;
    syncLog.completed_at = new Date();
    await syncLog.save();
    
    console.error('Tax Sync Error:', error);
    return { success: false, error: error.message };
  }
}
