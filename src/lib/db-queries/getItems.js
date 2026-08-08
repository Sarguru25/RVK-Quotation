import dbConnect from '../db';
import Item from '../../models/Item';

export async function getItems(options = {}) {
  await dbConnect();
  
  const {
    page = 1,
    limit = 50,
    search = '',
    status,
    item_type,
    sortField = 'name',
    sortOrder = 'asc'
  } = options;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (item_type) query.item_type = item_type;
  
  const skip = (page - 1) * limit;
  const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
  
  const [data, total] = await Promise.all([
    Item.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Item.countDocuments(query)
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

export async function getItemById(id) {
  await dbConnect();
  let item = await Item.findOne({ zoho_item_id: id }).lean();
  if (!item && id.match(/^[0-9a-fA-F]{24}$/)) {
    item = await Item.findById(id).lean();
  }
  return item;
}
