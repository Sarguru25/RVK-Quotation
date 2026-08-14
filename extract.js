const fs = require('fs');

const pageContent = fs.readFileSync('src/app/dashboard/quotations/page.jsx', 'utf8');

// For new/page.jsx:
// - Keep form state, itemsData, customersData, taxesData
// - Change export default function QuotationsPage to QuotationEditorPage
// - Add searchParams handling for ?edit=id & ?clone=id
// - Remove the data table UI and keep only the form UI
// - Remove open/setOpen and just render the form

let newPageContent = pageContent.replace('export default function QuotationsPage() {', 'export default function QuotationEditorPage() {');

// Remove list-specific queries and effects
const listVarsRegex = /const searchParams = useSearchParams\(\);\n\s*const pathname = usePathname\(\);\n\s*const page = Number[^\n]+\n\s*const limit = [^\n]+\n\s*const search = [^\n]+\n\s*const statusFilter = [^\n]+\n\s*const \[searchInput, setSearchInput\] = useState\(search\);\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[searchInput, pathname, router, searchParams, search\]\);\n\s*const updateUrlParams = [\s\S]*?router\.replace\(\`\$\{pathname\}\\\?\$\{params\.toString\(\)\}\`, \{ scroll: false \}\);\n\s*\};\n\s*const \{ data: queryData, isLoading: loading, refetch: fetchQuotes \} = useQuery\(\{[\s\S]*?placeholderData: keepPreviousData\n\s*\}\);/g;

newPageContent = newPageContent.replace(listVarsRegex, `const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const cloneId = searchParams.get('clone');
  const targetId = editId || cloneId;
  const isClone = !!cloneId;

  // We fetch the quote if there is a targetId
  useEffect(() => {
    if (!targetId) return;
    setEditingId(isClone ? null : targetId);
    async function fetchQuote() {
      try {
        const res = await fetch(\`/api/zoho/quotes/\$\{targetId\}\`);
        const fullQuote = await res.json();
        
        let fetchDiscountVal = fullQuote.discount || 0;
        let fetchDiscountType = fullQuote.discount_type || "amount";
        if (fullQuote.discount_percent && fullQuote.discount_percent > 0) {
          fetchDiscountVal = fullQuote.discount_percent;
          fetchDiscountType = "percent";
        }
        
        setForm({
          customer_id: fullQuote.customer_id || "",
          customer_name: fullQuote.customer_name || "",
          estimate_number: isClone ? "" : (fullQuote.estimate_number || ""),
          reference_number: isClone ? "" : (fullQuote.reference_number || ""),
          subject: fullQuote.subject || fullQuote.subject_content || "",
          date: isClone ? new Date().toISOString().split("T")[0] : (fullQuote.date || new Date().toISOString().split("T")[0]),
          expiry_date: fullQuote.expiry_date || "",
          notes: fullQuote.notes || "We thank you for your enquiry and look forward for your confirmation of order.",
          terms: fullQuote.terms || "",
          discount_value: fetchDiscountVal,
          discount_type: fetchDiscountType,
          shipping_charges: fullQuote.shipping_charge || 0,
          adjustment: fullQuote.adjustment || 0,
          default_tax_id: "",
          salesperson: fullQuote.custom_fields?.find(f => f.label === "Salesperson")?.value || "",
          epc_customer: fullQuote.custom_fields?.find(f => f.label === "EPC/ Customer")?.value || "",
          project: fullQuote.custom_fields?.find(f => f.label === "Project")?.value || "",
          end_user: fullQuote.custom_fields?.find(f => f.label === "End User")?.value || "",
          market_segment: fullQuote.custom_fields?.find(f => f.label === "Market Segment")?.value || "",
          estimated_margin: fullQuote.custom_fields?.find(f => f.label === "Estimated Margin (%)")?.value || "",
          line_items: (fullQuote.line_items || []).map(item => ({
            item_id: item.item_id || "",
            name: item.name || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            tax_id: item.tax_id || ""
          }))
        });
      } catch (err) {
        showToast("Error loading quotation data", "error");
      }
    }
    fetchQuote();
  }, [targetId, isClone]);
`);

// Remove old openEditModal function
newPageContent = newPageContent.replace(/async function openEditModal\(quote, isClone = false\) \{[\s\S]*?catch \{ showToast\("Something went wrong", "error"\); \}\n\s*\}/, "");

// Modify the return statement to just return the form UI
// The original UI has <div className="space-y-6 max-w-[1400px] mx-auto w-full"> and then {open && ...}
// We'll replace everything from return ( to the end.

const uiStartIndex = newPageContent.indexOf('return (');
const uiContent = newPageContent.substring(uiStartIndex);

// We need to extract the part inside `{open && (` and remove the wrapping `if(open)` and `fixed top-0` overlay
const formStartRegex = /\{open && \([\s]*<div className="fixed top-0 bottom-0 right-0 left-0 md:left-64 bg-gray-50 flex justify-center items-start overflow-auto z-\[50\]">([\s\S]*?)<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\);\n\s*\}/;

const match = uiContent.match(formStartRegex);
if (match) {
  let formBody = match[1];
  
  // replace X button and setOpen with router.push back to /dashboard/quotations
  formBody = formBody.replace(/onClick=\{\(\) => setOpen\(false\)\}/g, "onClick={() => router.push('/dashboard/quotations')}");
  
  // Also we want to ensure it takes up the full space, so we change bg-white w-full min-h-full relative to:
  formBody = formBody.replace('className="bg-white w-full min-h-full relative"', 'className="bg-gray-50 w-full min-h-screen relative"');
  // Make the header sticky but non-fixed if it was
  
  const newReturn = `return (\n${formBody}\n  );\n}`;
  newPageContent = newPageContent.substring(0, uiStartIndex) + newReturn;
}

fs.writeFileSync('src/app/dashboard/quotations/new/page.jsx', newPageContent);


// Now for src/app/dashboard/quotations/page.jsx
// We need to remove all form state and the modal, and change the buttons to route to /new?edit=id
let origPageContent = pageContent;

// 1. change create button routing
origPageContent = origPageContent.replace('onClick={() => { setEditingId(null); setForm(initialFormState); setOpen(true); }}', "onClick={() => router.push('/dashboard/quotations/new')}");

// 2. change edit/clone routing
origPageContent = origPageContent.replace(/async function openEditModal\(quote, isClone = false\) \{[\s\S]*?catch \{ showToast\("Something went wrong", "error"\); \}\n\s*\}/, `
  function openEditModal(quote, isClone = false) {
    const id = quote.zoho_estimate_id || quote.estimate_id || quote._id;
    if (isClone) {
      router.push(\`/dashboard/quotations/new?clone=\$\{id\}\`);
    } else {
      router.push(\`/dashboard/quotations/new?edit=\$\{id\}\`);
    }
  }
`);

// 3. remove the {open && ...} modal
origPageContent = origPageContent.replace(/\{open && \([\s\S]*?\)\}\n\s*(<\/div>\n\s*\);\n\s*\})/g, "$1");

fs.writeFileSync('src/app/dashboard/quotations/page.jsx', origPageContent);

console.log("Done");
