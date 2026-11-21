import fs from "fs";
const cfg = JSON.parse(fs.readFileSync("C:/Users/rdsx9/AppData/Roaming/netlify/Config/config.json", "utf8"));
const token = Object.values(cfg.users)[0].auth.token;
const siteId = "b53ad507-2900-4db0-ae31-43f02f457d1f";

/* Lista deploy keys existentes */
const l = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploy_keys`, { headers: { Authorization: `Bearer ${token}` } });
const keys = await l.json();
console.log("Deploy keys existentes:", JSON.stringify(keys).slice(0, 500));

if (!Array.isArray(keys) || keys.length === 0) {
  /* Cria deploy key */
  const r = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploy_keys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const k = await r.json();
  console.log("\nNOVA DEPLOY KEY (HTTP " + r.status + "):");
  console.log(JSON.stringify(k, null, 2).slice(0, 2000));
}
