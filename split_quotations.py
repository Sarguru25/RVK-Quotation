import re
import os

with open('src/app/dashboard/quotations/page.jsx', 'r') as f:
    content = f.read()

# 1. new/page.jsx
new_page = content.replace('export default function QuotationsPage() {', 'export default function NewQuotationPage() {')

# Find the start of the list UI.
# In QuotationsPage, the list UI is inside the main `return (` block which has <div className="p-6 md:p-8 max-w-7xl mx-auto">
# We want to replace everything from the first `return (` inside NewQuotationPage down to `{open && (` with nothing, or just find `{open && (` and keep that part.
# But wait, there's `if (loading)` just before the `return(`.

# Let's use regex to find `{open && (`.
match = re.search(r'\{open && \([\s]*<div className="fixed top-[^>]+>([\s\S]*?)</div>\s*\)\}\s*</div>\s*\);\s*\}', new_page)
if match:
    form_body = match.group(1)
    
    # We want to replace the list's `if (loading) { ... } return ( ... )` with just `return ( form_body ); }`
    # Let's find the position of `if (loading) {`
    pos = new_page.find('if (loading) {')
    if pos != -1:
        # Cut off the rest of the file and replace it
        top_part = new_page[:pos]
        
        # We need to add the query params fetching
        top_part = top_part.replace('const [open, setOpen] = useState(false);', '')
        top_part = top_part.replace('const [searchInput, setSearchInput] = useState(search);', '')
        
        # Remove the useQuery for quotes
        top_part = re.sub(r'const { data: queryData, isLoading: loading, refetch: fetchQuotes } = useQuery\({[\s\S]*?placeholderData: keepPreviousData\n\s*}\);', '', top_part)
        
        # Remove the router effects
        top_part = re.sub(r'useEffect\(\(\) => \{[\s\S]*?clearTimeout\(timer\);\n\s*\}, \[searchInput, pathname, router, searchParams, search\]\);', '', top_part)
        top_part = re.sub(r'const updateUrlParams = \(updates\) => \{[\s\S]*?\{ scroll: false \}\);\n\s*\};', '', top_part)
        
        # Change X button behavior
        form_body = form_body.replace('onClick={() => setOpen(false)}', "onClick={() => router.push('/dashboard/quotations')}")
        
        # Remove overlay classes from form
        form_body = form_body.replace('className="bg-white w-full min-h-full relative"', 'className="bg-gray-50 w-full min-h-screen relative"')
        
        new_page = top_part + f'\n  return (\n    <div className="bg-gray-50 w-full min-h-screen relative">\n      {form_body}\n    </div>\n  );\n}}\n'
        
        with open('src/app/dashboard/quotations/new/page.jsx', 'w') as f:
            f.write(new_page)

# 2. Update page.jsx
list_page = content

# Change Create button
list_page = list_page.replace('onClick={() => { setEditingId(null); setForm(initialFormState); setOpen(true); }}', "onClick={() => router.push('/dashboard/quotations/new')}")

# Change Edit/Clone button
list_page = re.sub(
    r'async function openEditModal\(quote, isClone = false\) \{[\s\S]*?catch \{ showToast\("Something went wrong", "error"\); \}\n\s*\}',
    '''function openEditModal(quote, isClone = false) {
    const id = quote.zoho_estimate_id || quote.estimate_id || quote._id;
    if (isClone) {
      router.push(`/dashboard/quotations/new?clone=${id}`);
    } else {
      router.push(`/dashboard/quotations/new?edit=${id}`);
    }
  }''',
    list_page
)

# Remove the {open && ( ... )} modal
list_page = re.sub(r'\{open && \([\s\S]*?</div>\s*\)\}\s*(</div>\s*\);\s*\})', r'\1', list_page)

with open('src/app/dashboard/quotations/page.jsx', 'w') as f:
    f.write(list_page)

print("Split completed.")
