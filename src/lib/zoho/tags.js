import { zohoFetch } from "./client";

let cachedTags = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 15; // 15 mins cache

export function getFallbackTags() {
  return {
    allTags: [],
    jobNumberTag: {
      tag_id: "2315070000000000333",
      tag_name: "Job Number",
      tag_options: [
        { tag_option_id: "2315070000000236277", tag_option_name: "SGS190010" },
        { tag_option_id: "2315070000000236279", tag_option_name: "SGS190011" },
        { tag_option_id: "2315070000000236281", tag_option_name: "SGS190014" },
        { tag_option_id: "2315070000000236283", tag_option_name: "SGS190015" },
        { tag_option_id: "2315070000000230261", tag_option_name: "SGS190016" },
        { tag_option_id: "2315070000000230281", tag_option_name: "SGS190017" },
        { tag_option_id: "2315070000000230279", tag_option_name: "SGS190018" },
        { tag_option_id: "2315070000000253003", tag_option_name: "SGS190019" },
        { tag_option_id: "2315070000001611283", tag_option_name: "SGS190040" },
      ],
    },
    marketSegmentTag: {
      tag_id: "2315070000000000335",
      tag_name: "Market Segment",
      tag_options: [
        { tag_option_id: "2315070000006075019", tag_option_name: "Building Services" },
        { tag_option_id: "2315070000006075011", tag_option_name: "Chemical & Petrochemical" },
        { tag_option_id: "2315070000006075017", tag_option_name: "Energy" },
        { tag_option_id: "2315070000006075009", tag_option_name: "General Industry" },
        { tag_option_id: "2315070000006075013", tag_option_name: "Marine Offshore" },
        { tag_option_id: "2315070000006075015", tag_option_name: "Water & Waste Water" },
      ],
    },
  };
}

export async function getReportingTags(forceRefresh = false) {
  if (!forceRefresh && cachedTags && Date.now() - cacheTime < CACHE_TTL) {
    return cachedTags;
  }

  try {
    const data = await zohoFetch("/settings/tags");
    const tagsList = data.reporting_tags || [];

    const fullTags = await Promise.all(
      tagsList.map(async (t) => {
        try {
          const detail = await zohoFetch(`/settings/tags/${t.tag_id}`);
          return detail.reporting_tag || t;
        } catch {
          return t;
        }
      })
    );

    const jobNumberTag = fullTags.find((t) => t.tag_name === "Job Number") || getFallbackTags().jobNumberTag;
    const marketSegmentTag = fullTags.find((t) => t.tag_name === "Market Segment") || getFallbackTags().marketSegmentTag;

    cachedTags = {
      allTags: fullTags,
      jobNumberTag,
      marketSegmentTag,
    };
    cacheTime = Date.now();
    return cachedTags;
  } catch (error) {
    console.error("[ZOHO TAGS] Failed to fetch reporting tags:", error.message);
    return getFallbackTags();
  }
}