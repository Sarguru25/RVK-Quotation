const fs = require('fs');

const lines = fs.readFileSync('src/app/dashboard/quotations/page.jsx', 'utf8').split('\n');

let newPage = [];
let listPage = [];

// Both start with imports and helpers up to QuotationsPage definition
let i = 0;
while (!lines[i].includes('export default function QuotationsPage() {')) {
  newPage.push(lines[i]);
  listPage.push(lines[i]);
  i++;
}

newPage.push('export default function NewQuotationPage() {');
listPage.push('export default function QuotationsPage() {');
i++;

while (i < lines.length) {
  const line = lines[i];

  // List specific things
  if (line.includes('const page = Number(searchParams.get("page")) || 1;')) {
    let j = i;
    while (!lines[j].includes('const { data: customersData } = useQuery({')) {
      listPage.push(lines[j]);
      j++;
    }
    
    // Add editId/cloneId to newPage
    newPage.push(`  const searchParams = useSearchParams();`);
    newPage.push(`  const router = useRouter();`);
    newPage.push(`  const editId = searchParams.get('edit');`);
    newPage.push(`  const cloneId = searchParams.get('clone');`);
    newPage.push(`  const targetId = editId || cloneId;`);
    newPage.push(`  const isClone = !!cloneId;`);
    
    i = j;
    continue;
  }

  // Quote data fetching
  if (line.includes('const quotes = queryData?.data || [];')) {
    listPage.push(line);
    i++;
    listPage.push(lines[i]); // customers
    newPage.push(lines[i]);
    i++;
    listPage.push(lines[i]); // users
    newPage.push(lines[i]);
    i++;
    listPage.push(lines[i]); // items
    newPage.push(lines[i]);
    i++;
    listPage.push(lines[i]); // taxes
    newPage.push(lines[i]);
    i++;
    listPage.push(lines[i]); // pagination
    i++;
    continue;
  }

  // Effect for fetching target quote in newPage
  if (line.includes('const initialFormState = {')) {
    newPage.push(line);
    listPage.push(line);
    let j = i + 1;
    while (!lines[j].includes('const [form, setForm] = useState(initialFormState);')) {
      newPage.push(lines[j]);
      listPage.push(lines[j]);
      j++;
    }
    newPage.push(lines[j]);
    listPage.push(lines[j]);
    
    newPage.push(`
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
    
    i = j + 1;
    continue;
  }
  
  // openEditModal modification
  if (line.includes('async function openEditModal(quote, isClone = false) {')) {
    listPage.push('  function openEditModal(quote, isClone = false) {');
    listPage.push('    const id = quote.zoho_estimate_id || quote.estimate_id || quote._id;');
    listPage.push('    if (isClone) {');
    listPage.push('      router.push(`/dashboard/quotations/new?clone=${id}`);');
    listPage.push('    } else {');
    listPage.push('      router.push(`/dashboard/quotations/new?edit=${id}`);');
    listPage.push('    }');
    listPage.push('  }');
    let j = i;
    while (!lines[j].includes('const filtered = quotes.filter(')) {
      j++;
    }
    i = j;
    continue;
  }

  // Stop newPage logic when hitting 'filtered = quotes.filter'
  if (line.includes('const filtered = quotes.filter(')) {
    let j = i;
    while (!lines[j].includes('{open && (')) {
      listPage.push(lines[j]);
      j++;
    }
    
    // We are at `{open && (`
    newPage.push('  return (');
    newPage.push('    <div className="bg-gray-50 w-full min-h-screen relative">');
    
    // Add the form contents to newPage
    j++; // skip {open && (
    j++; // skip <div className="fixed ... overlay
    
    while (!lines[j].includes('</div> // wrapper')) {
      let l = lines[j];
      l = l.replace('className="bg-white w-full min-h-full relative"', 'className="w-full min-h-full relative"');
      l = l.replace('onClick={() => setOpen(false)}', 'onClick={() => router.push(\'/dashboard/quotations\')}');
      if (l.trim() === ')}' && lines[j+1] && lines[j+1].trim() === '</div>' && lines[j+2] && lines[j+2].trim() === ');') {
        break;
      }
      newPage.push(l);
      j++;
    }
    
    newPage.push('  );');
    newPage.push('}');
    
    listPage.push('    </div>');
    listPage.push('  );');
    listPage.push('}');
    
    break;
  }

  // Common lines (state, helpers, etc)
  if (!line.includes('const [open, setOpen]') && !line.includes('const [searchInput, setSearchInput]')) {
    newPage.push(line);
  }
  listPage.push(line);
  i++;
}

// Write the files
fs.writeFileSync('src/app/dashboard/quotations/new/page.jsx', newPage.join('\n'));
fs.writeFileSync('src/app/dashboard/quotations/page.jsx', listPage.join('\n'));

console.log("Extraction complete!");
