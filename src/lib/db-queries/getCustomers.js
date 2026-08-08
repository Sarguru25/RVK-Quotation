import dbConnect from '../db';
import Customer from '../../models/Customer';

export async function getCustomers(options = {}) {
  await dbConnect();
  
  const {
    page = 1,
    limit = 50,
    search = '',
    status,
    sortField = 'customer_name',
    sortOrder = 'asc'
  } = options;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { customer_name: { $regex: search, $options: 'i' } },
      { company_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter out vendors from the list (Zoho often syncs both contact types)
  query['rawZohoData.contact_type'] = { $ne: 'vendor' };
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
  
  const [data, total] = await Promise.all([
    Customer.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Customer.countDocuments(query)
  ]);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
}

export async function getCustomerById(id) {
  await dbConnect();
  // id could be mongodb id or zoho_customer_id. 
  // Let's assume we use zoho_customer_id in most places.
  let customer = await Customer.findOne({ zoho_customer_id: id }).lean();
  if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findById(id).lean();
  }
  return customer;
}
