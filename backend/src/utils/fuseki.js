// backend/src/utils/fuseki.js
import fetch from "node-fetch";

const FUSEKI_QUERY_URL =
  process.env.FUSEKI_QUERY_URL || "http://localhost:3030/spotify/query";

// Run a SPARQL SELECT query against Fuseki
export async function runSelect(query) {
  const res = await fetch(FUSEKI_QUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
    },
    body: query,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[Fuseki SELECT Error]", text);
    throw new Error("Fuseki SELECT query failed");
  }

  return res.json();
}
