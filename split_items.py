import re

with open('src/app/dashboard/items/page.jsx', 'r') as f:
    content = f.read()

# Update create button
content = content.replace('onClick={openCreateModal}', "onClick={() => window.location.href = '/dashboard/items/new'}")

# Update edit button
content = content.replace('onClick={() => openEditModal(item)}', "onClick={() => window.location.href = `/dashboard/items/new?edit=${item.item_id || item._id}`}")

# Remove modalOpen state and modal UI
# In page.jsx, modal starts around {modalOpen && ( ... )}
# Let's use regex to remove it
content = re.sub(r'\{modalOpen && \([\s\S]*?</div>\s*\)\s*\)\}', '', content)

# Remove modal Open functions
content = re.sub(r'// Open create modal[\s\S]*?\}', '', content)
content = re.sub(r'// Open edit modal[\s\S]*?setModalOpen\(true\);\n\s*\}', '', content)

# Remove form state
content = re.sub(r'// Form state[\s\S]*?const \[form, setForm\] = useState\(initialFormState\);', '', content)

# Remove handleSaveItem
content = re.sub(r'// Save \(create or update\)[\s\S]*?finally \{\n\s*setSaving\(false\);\n\s*\}\n\s*\}', '', content)

# Remove unitOptions
content = re.sub(r'// Unit options[\s\S]*?\];', '', content)

with open('src/app/dashboard/items/page.jsx', 'w') as f:
    f.write(content)

print("Split items completed.")
