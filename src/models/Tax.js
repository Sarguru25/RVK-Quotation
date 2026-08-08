import mongoose from 'mongoose';

const TaxSchema = new mongoose.Schema({
  zoho_tax_id: { type: String, unique: true, index: true },
  tax_name: { type: String },
  tax_percentage: { type: Number },
  tax_type: { type: String },
  is_value_added: { type: Boolean },
  status: { type: String },
  created_time: { type: Date },
  last_modified_time: { type: Date },
  syncedAt: { type: Date, default: Date.now },
  rawZohoData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Tax || mongoose.model('Tax', TaxSchema);
