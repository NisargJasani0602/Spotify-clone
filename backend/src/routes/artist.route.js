// backend/src/routes/artist.route.js

import express from "express";
import { runSelect } from "../utils/fuseki.js";

const router = express.Router();

/**
 * ARTIST–GENRE–TRACK GRAPH (clean semantic data)
 * Nodes: artist | genre | track
 * Edges: 
 *   genre -> artist
 *   artist -> track
 */
router.get("/graph", async (req, res) => {
  try {
    const query = `
      PREFIX : <http://example.org/spotify#>

      SELECT ?artist ?artistName ?genre ?genreLabel ?track ?trackName
      WHERE {
        ?artist a :Artist ;
                :name ?artistName .

        OPTIONAL {
          ?artist :hasGenre ?genre .
          ?genre :label ?genreLabel .
        }

        OPTIONAL {
          ?track :performedBy ?artist ;
                 :title ?trackName .
        }
      }
    `;

    const json = await runSelect(query);

    const nodes = [];
    const edges = [];

    const addedNodes = new Set();

    json.results.bindings.forEach(b => {
      const artist = b.artist.value;
      const artistName = b.artistName.value;

      // Artist node
      if (!addedNodes.has(artist)) {
        nodes.push({
          id: artist,
          label: artistName,
          type: "artist"
        });
        addedNodes.add(artist);
      }

      // Genre node
      if (b.genre) {
        const genre = b.genre.value;
        const genreLabel = b.genreLabel.value;

        if (!addedNodes.has(genre)) {
          nodes.push({
            id: genre,
            label: genreLabel,
            type: "genre"
          });
          addedNodes.add(genre);
        }

        edges.push({
          source: genre,
          target: artist,
          type: "genre-to-artist"
        });
      }

      // Track node
      if (b.track) {
        const track = b.track.value;
        const trackName = b.trackName.value;

        if (!addedNodes.has(track)) {
          nodes.push({
            id: track,
            label: trackName,
            type: "track"
          });
          addedNodes.add(track);
        }

        edges.push({
          source: artist,
          target: track,
          type: "artist-to-track"
        });
      }
    });

    res.json({ nodes, edges });

  } catch (error) {
    console.error("Artist Graph Error:", error);
    res.status(500).json({ error: "Failed to build artist graph" });
  }
});

export default router;
