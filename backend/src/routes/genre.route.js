import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const FUSEKI_QUERY_URL =
  process.env.FUSEKI_QUERY_URL ||
  "http://localhost:3030/spotify/query";

// ---- SPARQL JSON Helper ----
async function runSparql(query) {
  const res = await fetch(FUSEKI_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/sparql-query" },
    body: query,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Fuseki error: " + txt);
  }
  return res.json();
}

// ---- GET /api/genre/graph ----
router.get("/graph", async (req, res) => {
  try {
    const query = `
      PREFIX : <http://example.org/spotify#>

      SELECT ?track ?title ?genre
      WHERE {
        ?track a :Track ;
               :title ?title ;
               :hasGenre ?genre .
      }
    `;

    const json = await runSparql(query);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    json.results.bindings.forEach(row => {
      const track = row.track.value;
      const title = row.title.value;
      const genre = row.genre.value;

      if (!nodeSet.has(track)) {
        nodes.push({ id: track, label: title, type: "track" });
        nodeSet.add(track);
      }

      if (!nodeSet.has(genre)) {
        const label = genre.split("#")[1].replace("genre_", "").replace(/_/g, " ");
        nodes.push({ id: genre, label, type: "genre" });
        nodeSet.add(genre);
      }

      edges.push({ source: track, target: genre });
    });

    return res.json({ nodes, edges });
  } catch (err) {
    console.error("graph error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
