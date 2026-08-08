import { zohoFetch } from "./client";

/**
 * Get all items (products/services)
 */
export async function getItems(params = {}) {
  let allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await zohoFetch("/items", { params: { ...params, page, per_page: 200 } });
    allItems = allItems.concat(data.items || []);
    
    if (data.page_context && data.page_context.has_more_page) {
      page++;
    } else {
      hasMore = false;
    }
  }

  return allItems;
}

/**
 * Get a specific item by ID
 */
export async function getItemById(id) {
  const data = await zohoFetch(`/items/${id}`);
  return data.item;
}

/**
 * Update an item by ID
 */
export async function updateItem(id, itemData) {
  const data = await zohoFetch(`/items/${id}`, {
    method: "PUT",
    body: itemData,
  });
  return data;
}

/**
 * Delete an item by ID
 */
export async function deleteItem(id) {
  const data = await zohoFetch(`/items/${id}`, {
    method: "DELETE",
  });
  return data;
}

/**
 * Create a new item
 */
export async function createItem(itemData) {
  const data = await zohoFetch("/items", {
    method: "POST",
    body: itemData,
  });
  return data;
}
