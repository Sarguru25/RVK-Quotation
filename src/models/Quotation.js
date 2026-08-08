import mongoose from 'mongoose';

const QuotationLineItemSchema = new mongoose.Schema({
  item_id: { type: String },
  name: { type: String },
  quantity: { type: Number },
  rate: { type: Number },
  tax_percentage: { type: Number },
  item_total: { type: Number }
});

const QuotationSchema = new mongoose.Schema({
  zoho_estimate_id: { type: String, unique: true, index: true },
  estimate_number: { type: String },
  customer_id: { type: String },
  customer_name: { type: String },
  date: { type: Date },
  expiry_date: { type: Date },
  status: { type: String },
  currency_code: { type: String },
  sub_total: { type: Number },
  tax_total: { type: Number },
  total: { type: Number },
  salesperson_name: { type: String },
  subject: { type: String },
  notes: { type: String },
  terms: { type: String },
  line_items: [QuotationLineItemSchema],
  syncedAt: { type: Date, default: Date.now },
  last_modified_time: { type: Date, index: true },
  rawZohoData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

QuotationSchema.index({ estimate_number: 1 });
QuotationSchema.index({ customer_name: 1 });
QuotationSchema.index({ status: 1 });
QuotationSchema.index({ date: -1 });

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
