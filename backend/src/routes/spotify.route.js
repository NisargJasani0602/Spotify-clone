// backend/src/routes/spotify.route.js
import express from "express";

const router = express.Router();

// ---------- ENVIRONMENT ----------
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const FUSEKI_DATA_URL =
  process.env.FUSEKI_DATA_URL || "http://localhost:3030/spotify/data";

// ---------- TOKEN STORAGE ----------
let accessToken = null;
let refreshToken = null;
let accessTokenExpiresAt = 0;

function isTokenExpired() {
  return !accessToken || Date.now() >= accessTokenExpiresAt - 60_000;
}

const basicAuthHeader =
  "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

// ---------- LOGIN ----------
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: [
      "user-library-read",
      "user-read-recently-played",
      "playlist-read-private",
    ].join(" "),
    show_dialog: "true",
  });

  return res.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
});

// ---------- CALLBACK ----------
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const json = await tokenRes.json();

    accessToken = json.access_token;
    refreshToken = json.refresh_token;
    accessTokenExpiresAt = Date.now() + json.expires_in * 1000;

    console.log("[spotify.callback] Token:", json);

    res.send("Spotify linked! Now call POST /api/spotify/import");
  } catch (err) {
    console.error("[spotify.callback] Error:", err);
    res.status(500).send("Callback error");
  }
});

// ---------- TOKEN REFRESH ----------
async function ensureAccessToken() {
  if (!isTokenExpired()) return accessToken;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await tokenRes.json();

  accessToken = json.access_token;
  if (json.refresh_token) refreshToken = json.refresh_token;
  accessTokenExpiresAt = Date.now() + json.expires_in * 1000;

  console.log("[spotify.refresh] Token refreshed");
  return accessToken;
}

// ---------- SPOTIFY GET HELPERS ----------
async function spotifyGet(path) {
  const token = await ensureAccessToken();

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify GET ${path} failed: ${txt}`);
  }

  return res.json();
}

// ---------- FETCH UP TO 300 TRACKS ----------
async function fetchAllSavedTracks(maxTracks = 200) {
  let tracks = [];
  let offset = 0;

  while (tracks.length < maxTracks) {
    const page = await spotifyGet(`/me/tracks?limit=50&offset=${offset}`);

    const newTracks = page.items.map(i => i.track).filter(Boolean);
    tracks.push(...newTracks);

    if (!page.next) break; // No more pages
    offset += 50;
  }

  return tracks.slice(0, maxTracks);
}

// ---------- FEATURES ----------
async function getAudioFeatures(idsArray) {
  const chunks = [];
  for (let i = 0; i < idsArray.length; i += 10) {
    chunks.push(idsArray.slice(i, i + 10));
  }

  const features = {};

  for (const chunk of chunks) {
    try {
      const json = await spotifyGet(`/audio-features?ids=${chunk.join(",")}`);

      for (const f of json.audio_features) {
        if (f && f.id) features[f.id] = f;
      }
    } catch (err) {
      console.warn("⚠️ Error fetching audio features:", chunk.join(","));
    }
  }

  return features;
}

// ---------- ARTIST GENRES ----------
async function fetchArtistGenres(artistIds) {
  const unique = [...new Set(artistIds)];
  const chunks = [];

  for (let i = 0; i < unique.length; i += 50) {
    chunks.push(unique.slice(i, i + 50));
  }

  const map = {};

  for (const chunk of chunks) {
    const res = await spotifyGet(`/artists?ids=${chunk.join(",")}`);

    for (const a of res.artists) {
      map[a.id] = a.genres ?? [];
    }
  }

  return map;
}

// ---------- IMPORT ROUTE ----------
router.post("/import", async (req, res) => {
  try {
    // Fetch up to 200 tracks using pagination
    const tracks = await fetchAllSavedTracks(200);

    const artistIds = tracks.map(t => t.artists?.[0]?.id).filter(Boolean);
    const genresByArtist = await fetchArtistGenres(artistIds);

    const trackIds = tracks.map(t => t.id);
    const featuresById = await getAudioFeatures(trackIds);

    const ttl = buildTurtleFromSpotify(tracks, featuresById, genresByArtist);

    const upload = await fetch(FUSEKI_DATA_URL, {
      method: "POST",
      headers: { "Content-Type": "text/turtle" },
      body: ttl,
    });

    if (!upload.ok) {
      const txt = await upload.text();
      return res.status(500).json({ error: "Fuseki import failed", details: txt });
    }

    console.log(`[spotify.import] Imported ${tracks.length} tracks.`);
    res.json({ message: "Imported to Fuseki", count: tracks.length });

  } catch (err) {
    console.error("[spotify.import] error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- TURTLE ----------
function escapeLiteral(str = "") {
  return String(str).replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function buildTurtleFromSpotify(tracks, featuresById, genresByArtist) {
  let ttl = `
@prefix : <http://example.org/spotify#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
`;

  for (const t of tracks) {
    const id = t.id;
    const trackIri = `:${id}`;
    const artist = t.artists?.[0];
    const feat = featuresById[id];
    const featIri = `:feat_${id}`;

    ttl += `
${trackIri} a :Track ;
  :title "${escapeLiteral(t.name)}" ;
  :hasFeature ${featIri} .
`;

    if (artist) {
      ttl += `
:${artist.id} a :Artist ;
  :name "${escapeLiteral(artist.name)}" .
${trackIri} :performedBy :${artist.id} .
`;

      const genres = genresByArtist[artist.id] ?? [];
      for (const g of genres) {
        const gid = g.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        ttl += `
:genre_${gid} a :Genre ;
  :label "${escapeLiteral(g)}" .
${trackIri} :hasGenre :genre_${gid} .
`;
      }
    }

    if (feat) {
      ttl += `
${featIri} a :AudioFeature ;
  :tempo "${feat.tempo}"^^xsd:float ;
  :energy "${feat.energy}"^^xsd:float ;
  :danceability "${feat.danceability}"^^xsd:float ;
  :valence "${feat.valence}"^^xsd:float .
`;
    }
  }

  return ttl;
}

export default router;
