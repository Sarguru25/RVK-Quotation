import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a role name'],
    unique: true,
  },
  description: {
    type: String,
  },
  permissions: [{
    type: String,
  }],
  isSystemRole: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
