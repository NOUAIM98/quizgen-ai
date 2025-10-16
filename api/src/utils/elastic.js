import { Client } from "@elastic/elasticsearch";

// ✅ Required environment variables
const REQUIRED_VARS = ["ELASTIC_URL", "ELASTIC_API_KEY", "ELASTIC_INDEX"];
for (const key of REQUIRED_VARS) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

// ✅ Elasticsearch client using URL + API key
export const es = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

export const ES_INDEX = process.env.ELASTIC_INDEX;

/**
 * ✅ Ensure index exists (creates if missing)
 */
export async function ensureIndex() {
  const exists = await es.indices.exists({ index: ES_INDEX });
  if (exists) return;

  await es.indices.create({
    index: ES_INDEX,
    mappings: {
      properties: {
        text: { type: "text" },
        title: { type: "keyword" },
        docId: { type: "keyword" },
        page: { type: "integer" },
        embedding: {
          type: "dense_vector",
          dims: 768,
          index: true,
          similarity: "cosine",
        },
      },
    },
  });

  console.log(`[elastic] ✅ Index created: ${ES_INDEX}`);
}

/**
 * ✅ Hybrid search (keyword + vector)
 */
export async function hybridSearch({ queryText, queryVector, k = 20, size = 6 }) {
  const body = {
    knn: {
      field: "embedding",
      query_vector: queryVector,
      k,
      num_candidates: Math.max(100, k * 5),
    },
    query: {
      bool: { should: [{ match: { text: queryText } }] },
    },
    size,
    _source: ["text", "title", "docId", "page"],
  };

  const response = await es.search({ index: ES_INDEX, body });
  return response.hits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    ...hit._source,
  }));
}
