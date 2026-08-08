import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  zoho_item_id: { type: String, unique: true, index: true },
  name: { type: String },
  sku: { type: String },
  description: { type: String },
  rate: { type: Number },
  purchase_rate: { type: Number },
  tax_id: { type: String },
  tax_name: { type: String },
  tax_percentage: { type: Number },
  item_type: { type: String },
  unit: { type: String },
  status: { type: String },
  stock_on_hand: { type: Number },
  available_stock: { type: Number },
  created_time: { type: Date },
  last_modified_time: { type: Date },
  syncedAt: { type: Date, default: Date.now },
  rawZohoData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
