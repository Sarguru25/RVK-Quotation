import dbConnect from '../db';
import Tax from '../../models/Tax';

export async function getTaxes(options = {}) {
  await dbConnect();
  
  const {
    page = 1,
    limit = 100, // typically taxes are fewer, load more
    search = '',
    status = 'active', // default to active taxes
    sortField = 'tax_name',
    sortOrder = 'asc'
  } = options;
  
  const query = {};
  
  if (search) {
    query.tax_name = { $regex: search, $options: 'i' };
  }
  
  if (status && status !== 'all') {
    query.status = { $regex: new RegExp(`^${status}$`, 'i') };
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
  
  const [data, total] = await Promise.all([
    Tax.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Tax.countDocuments(query)
  ]);
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
