// api/scripts/es-test.mjs ✅ Clean version for Node 18+
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { Client } from "@elastic/elasticsearch";

// --- Resolve .env path ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../.env");

// --- Load environment variables ---
config({ path: ENV_PATH, override: true, debug: true });
console.log("[env] Loaded from:", ENV_PATH);

// --- Elasticsearch setup ---
const url = process.env.ELASTIC_URL?.trim();
const apiKey = process.env.ELASTIC_API_KEY?.trim();
const indexName = process.env.ELASTIC_INDEX || "quizgen-ai";

if (!url || !apiKey) {
  console.error("❌ Missing ELASTIC_URL or ELASTIC_API_KEY in .env");
  process.exit(1);
}

if (!url.includes(":443")) {
  console.error("❌ ELASTIC_URL must include :443 ->", url);
  process.exit(1);
}

const client = new Client({
  node: url,
  auth: { apiKey },
});

// --- Run test ---
(async () => {
  try {
    console.log("[es-test] Connecting to:", url);

    // Ping test
    const ping = await client.ping();
    console.log("[es-test] ✅ Ping success:", ping);

    // Auth check
    const me = await client.transport.request({
      method: "GET",
      path: "/_security/_authenticate",
    });
    console.log("[es-test] 👤 Authenticated as:", me.user?.username);

    // Index existence
    const exists = await client.indices.exists({ index: indexName });
    console.log(`[es-test] 📦 Index "${indexName}" exists:`, exists);

    // --- New part: List sample documents ---
    if (exists) {
      console.log(`\n🔍 Listing first 3 docs in "${indexName}"...\n`);
      const { hits } = await client.search({
        index: indexName,
        size: 3,
        query: { match_all: {} },
      });

      if (hits.hits.length === 0) {
        console.log("⚠️ No documents found in index yet.");
      } else {
        hits.hits.forEach((h, i) => {
          console.log(`Doc ${i + 1}:`);
          console.log("  docId:", h._source?.docId);
          console.log("  page:", h._source?.page);
          console.log("  text snippet:", h._source?.text?.slice(0, 150));
          console.log("––––––––––––––––––––––––––––––––––––––––––");
        });
      }
    }

    process.exit(0);
  } catch (err) {
    const msg = err?.meta?.body?.error?.reason || err.message;
    console.error("❌ ERROR:", msg);

    const hint = err?.meta?.body?.error?.additional_unsuccessful_credentials;
    if (hint) console.error("Hint:", hint);

    console.error(
      "💡 Tips:\n• If you see 'Illegal base64 character 5f' => key has '_' → Not Encoded\n• Ensure URL has :443\n• Use the Encoded API key from Elastic dashboard"
    );

    console.log("[debug] API key head:", apiKey.slice(0, 10));
    process.exit(1);
  }
})();
