import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

async function main() {
  const tokenRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: env.ZOHO_REFRESH_TOKEN,
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  
  // Try to mark an estimate as draft (just fetching a random estimate)
  const estRes = await fetch(`https://www.zohoapis.com/books/v3/estimates?organization_id=${env.ZOHO_ORGANIZATION_ID}&status=approved`, {
    headers: { "Authorization": `Zoho-oauthtoken ${token}` }
  });
  const estData = await estRes.json();
  if (estData.estimates && estData.estimates.length > 0) {
     const id = estData.estimates[0].estimate_id;
     console.log("Found approved estimate:", id);
     
     // Let's test if there is a draft endpoint or if we can update it
     const testDraft = await fetch(`https://www.zohoapis.com/books/v3/estimates/${id}/status/draft?organization_id=${env.ZOHO_ORGANIZATION_ID}`, {
       method: "POST",
       headers: { "Authorization": `Zoho-oauthtoken ${token}` }
     });
     console.log("Draft response status:", testDraft.status);
     const draftText = await testDraft.text();
     console.log("Draft response:", draftText);
  } else {
     console.log("No approved estimates found.");
  }
}
main();
