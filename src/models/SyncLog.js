import mongoose from 'mongoose';

const SyncLogSchema = new mongoose.Schema({
  module: { type: String },
  sync_type: { type: String }, // e.g., 'manual', 'incremental', 'cron'
  records_processed: { type: Number, default: 0 },
  success_count: { type: Number, default: 0 },
  failed_count: { type: Number, default: 0 },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  status: { type: String, enum: ['running', 'completed', 'failed'] },
  error_message: { type: String }
}, { timestamps: true });

export default mongoose.models.SyncLog || mongoose.model('SyncLog', SyncLogSchema);
