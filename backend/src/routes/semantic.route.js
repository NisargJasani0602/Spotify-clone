import express from "express";

const router = express.Router();
const FUSEKI_QUERY = process.env.FUSEKI_QUERY_URL || "http://localhost:3030/spotify/sparql";

async function runSelect(query) {
  const resp = await fetch(FUSEKI_QUERY + "?query=" + encodeURIComponent(query), {
    headers: { "Accept": "application/sparql-results+json" },
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error("SPARQL error: " + resp.status + " " + t);
  }
  const data = await resp.json();
  return data.results.bindings.map(b => {
    const o = {};
    for (const k of Object.keys(b)) o[k] = b[k].value;
    return o;
  });
}

// GET /semantic/party-tracks?minEnergy=0.8&minDance=0.7&minTempo=120
router.get("/party-tracks", async (req, res) => {
  const minEnergy = Number(req.query.minEnergy ?? 0.8);
  const minDance = Number(req.query.minDance ?? 0.7);
  const minTempo = Number(req.query.minTempo ?? 120);

  const q = `
    PREFIX : <http://example.org/spotify#>
    SELECT ?track ?title ?artistName ?tempo ?energy ?dance WHERE {
      ?track a :Track ; :title ?title ; :performedBy ?a ; :hasFeature ?f .
      ?a :name ?artistName .
      ?f :energy ?energy ; :danceability ?dance ; :tempo ?tempo .
      FILTER(?energy > ${minEnergy} && ?dance > ${minDance} && ?tempo >= ${minTempo})
    } ORDER BY DESC(?energy) DESC(?dance) LIMIT 50
  `;
  try { res.json(await runSelect(q)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /semantic/similar?seedId=track_1&d=0.1&t=5
router.get("/similar", async (req, res) => {
  const seedId = req.query.seedId || "track_1";
  const d = Number(req.query.d ?? 0.1);
  const t = Number(req.query.t ?? 5);
  const q = `
    PREFIX : <http://example.org/spotify#>
    SELECT ?rec ?title ?artistName WHERE {
      :${seedId} :hasFeature ?sf .
      ?sf :energy ?se ; :danceability ?sd ; :tempo ?st .

      ?rec a :Track ; :title ?title ; :performedBy ?a ; :hasFeature ?f .
      ?a :name ?artistName .
      ?f :energy ?e2 ; :danceability ?d2 ; :tempo ?t2 .

      FILTER(?rec != :${seedId})
      FILTER(ABS(?e2-?se) < ${d} && ABS(?d2-?sd) < ${d} && ABS(?t2-?st) < ${t})
    } LIMIT 25
  `;
  try { res.json(await runSelect(q)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /semantic/genre-recs  { "liked": ["track_1", "track_2"] }
router.post("/genre-recs", express.json(), async (req, res) => {
  const liked = Array.isArray(req.body.liked) ? req.body.liked : [];
  const values = liked.map(id => `:${id}`).join(" ") || ":track_1";
  const q = `
    PREFIX : <http://example.org/spotify#>
    SELECT ?rec ?title ?becauseGenre WHERE {
      VALUES ?liked { ${values} }
      ?liked :hasGenre ?g .
      ?rec a :Track ; :title ?title ; :hasGenre ?g .
      BIND(?g AS ?becauseGenre)
      FILTER(?rec != ?liked)
    } GROUP BY ?rec ?title ?becauseGenre
    LIMIT 30
  `;
  try { res.json(await runSelect(q)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
