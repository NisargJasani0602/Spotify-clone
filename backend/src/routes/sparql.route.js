import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Fuseki SPARQL endpoint
const FUSEKI_QUERY_URL =
  process.env.FUSEKI_QUERY_URL || "http://localhost:3030/spotify/query";

// Helper to run SPARQL queries
async function runSparql(query) {
  const res = await fetch(FUSEKI_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/sparql-query" },
    body: query,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Fuseki SPARQL error: " + txt);
  }

  return res.json();
}

/**
 * GET /api/genre/graph
 * Returns nodes + links for D3.js
 */
router.get("/genre/graph", async (req, res) => {
  try {
    const query = `
      PREFIX : <http://example.org/spotify#>
      SELECT ?track ?title ?genreLabel WHERE {
        ?track a :Track ;
               :title ?title ;
               :hasGenre ?g .
        ?g :label ?genreLabel .
      }
    `;

    const data = await runSparql(query);

    const nodes = [];
    const links = [];

    const nodeMap = new Set();

    for (const b of data.results.bindings) {
      const trackIRI = b.track.value;
      const trackId = trackIRI.split("#")[1];
      const trackTitle = b.title.value;

      const genreLabel = b.genreLabel.value;
      const genreId = "genre_" + genreLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");

      // Track node
      if (!nodeMap.has(trackId)) {
        nodes.push({
          id: trackId,
          type: "track",
          label: trackTitle,
        });
        nodeMap.add(trackId);
      }

      // Genre node
      if (!nodeMap.has(genreId)) {
        nodes.push({
          id: genreId,
          type: "genre",
          label: genreLabel,
        });
        nodeMap.add(genreId);
      }

      // Link
      links.push({
        source: trackId,
        target: genreId,
      });
    }

    res.json({ nodes, links });
  } catch (err) {
    console.error("genre graph error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
