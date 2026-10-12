import { zohoFetch } from "./client";

let cachedAccounts = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 15; // 15 mins cache

export const FALLBACK_COGS_ACCOUNTS = [
  {
    account_id: "2315070000000034003",
    account_name: "Direct Materials",
    account_code: "50-001",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-001 ] Direct Materials",
  },
  {
    account_id: "2315070000000212011",
    account_name: "Direct Services",
    account_code: "50-002",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-002 ] Direct Services",
  },
  {
    account_id: "2315070000000212017",
    account_name: "Freight",
    account_code: "50-003",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-003 ] Freight",
  },
  {
    account_id: "2315070000000239167",
    account_name: "GST on Imports",
    account_code: "50-010",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-010 ] GST on Imports",
  },
  {
    account_id: "2315070000000212023",
    account_name: "Insurance - Marine/Cargo",
    account_code: "50-004",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-004 ] Insurance - Marine/Cargo",
  },
  {
    account_id: "2315070000000212029",
    account_name: "Miscellaneous Cost of Sales",
    account_code: "50-009",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-009 ] Miscellaneous Cost of Sales",
  },
  {
    account_id: "2315070000003954029",
    account_name: "Purchase Discount (COS)",
    account_code: "50-005",
    account_type: "cost_of_goods_sold",
    display_name: "[ 50-005 ] Purchase Discount (COS)",
  },
];

export const FALLBACK_SALES_ACCOUNTS = [
  {
    account_id: "2315070000000000388",
    account_name: "Sales",
    account_code: "40-001",
    account_type: "income",
    display_name: "[ 40-001 ] Sales",
  },
  {
    account_id: "2315070000000000391",
    account_name: "General Income",
    account_code: "40-002",
    account_type: "income",
    display_name: "[ 40-002 ] General Income",
  },
  {
    account_id: "2315070000000010001",
    account_name: "Other Charges",
    account_code: "40-003",
    account_type: "income",
    display_name: "[ 40-003 ] Other Charges",
  },
];

function formatAccount(a) {
  const code = a.account_code || "";
  return {
    account_id: a.account_id,
    account_name: a.account_name,
    account_code: code,
    account_type: a.account_type,
    display_name: code ? `[ ${code} ] ${a.account_name}` : a.account_name,
  };
}

/**
 * Fetch chart of accounts from Zoho Books and categorize them
 * into sales accounts (income) and purchase accounts (cost of goods sold, expense).
 */
export async function getAccounts(forceRefresh = false) {
  if (!forceRefresh && cachedAccounts && Date.now() - cacheTime < CACHE_TTL) {
    return cachedAccounts;
  }

  try {
    const data = await zohoFetch("/chartofaccounts");
    const chart = data.chartofaccounts || [];

    const salesAccounts = chart
      .filter((a) => a.account_type === "income" && a.status === "active")
      .map(formatAccount);

    const cogsAccounts = chart
      .filter((a) => a.account_type === "cost_of_goods_sold" && a.status === "active")
      .map(formatAccount);

    const expenseAccounts = chart
      .filter(
        (a) =>
          ["expense", "other_expense"].includes(a.account_type) &&
          a.status === "active"
      )
      .map(formatAccount);

    cachedAccounts = {
      salesAccounts: salesAccounts.length > 0 ? salesAccounts : FALLBACK_SALES_ACCOUNTS,
      cogsAccounts: cogsAccounts.length > 0 ? cogsAccounts : FALLBACK_COGS_ACCOUNTS,
      expenseAccounts,
      purchaseAccounts: [...cogsAccounts, ...expenseAccounts],
      allAccounts: chart.map(formatAccount),
    };
    cacheTime = Date.now();
    return cachedAccounts;
  } catch (error) {
    console.error("[ZOHO ACCOUNTS] Failed to fetch chart of accounts from Zoho:", error.message);
    return {
      salesAccounts: FALLBACK_SALES_ACCOUNTS,
      cogsAccounts: FALLBACK_COGS_ACCOUNTS,
      expenseAccounts: [],
      purchaseAccounts: FALLBACK_COGS_ACCOUNTS,
      allAccounts: [...FALLBACK_SALES_ACCOUNTS, ...FALLBACK_COGS_ACCOUNTS],
    };
  }
}
