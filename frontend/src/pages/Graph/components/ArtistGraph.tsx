import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Node {
  id: string;
  label: string;
  type: "genre" | "artist" | "track";
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

export default function ArtistGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("http://localhost:5001/api/artist/graph");
      const data = await res.json();

      const width = window.innerWidth;
      const height = window.innerHeight;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      // --- ZOOM ---
      const zoom = d3.zoom()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));

      svg.call(zoom as any);

      svg.on("dblclick.zoom", null);
      svg.on("dblclick", () => {
        svg.transition().duration(500)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

      // --- Genre Color Map (stable random colors) ---
      const genreColor = d3.scaleOrdinal(d3.schemeTableau10);

      // --- Genre Size Scaling Based on Artist Count ---
      const genreCounts: Record<string, number> = {};

      data.edges.forEach((e: Edge) => {
        if (e.type === "genre-to-artist") {
          genreCounts[e.source] = (genreCounts[e.source] || 0) + 1;
        }
      });

      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(Object.values(genreCounts)) || 1])
        .range([12, 40]);

      // --- D3 Force Simulation ---
      const simulation = d3.forceSimulation<Node>(data.nodes)
        .force(
          "link",
          d3.forceLink(data.edges)
            .id((d: any) => d.id)
            .distance((d: any) => {
              if (d.type === "genre-to-artist") return 160;
              if (d.type === "artist-to-track") return 120;
              return 100;
            })
        )
        .force("charge", d3.forceManyBody().strength(-220))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(40));

      // --- Edges ---
      const link = g
        .append("g")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .attr("stroke-width", (d) => (d.type === "genre-to-artist" ? 2 : 1));

      // --- Nodes ---
      const node = g
        .append("g")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", (d) => {
          if (d.type === "genre") return sizeScale(genreCounts[d.id] || 1);
          if (d.type === "artist") return 12;
          return 6; // track node
        })
        .attr("fill", (d) => {
          if (d.type === "genre") return genreColor(d.id);
          if (d.type === "artist") return "#4da3ff";
          return "#fff";
        })
        .call(
          d3
            .drag<SVGCircleElement, Node>()
            .on("start", dragStart)
            .on("drag", dragged)
            .on("end", dragEnd)
        );

      // --- Labels ---
      const label = g
        .append("g")
        .selectAll("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .text((d) => d.label)
        .attr("font-size", "13px")
        .attr("dx", 14)
        .attr("dy", 4)
        .attr("fill", "#ccc");

      // --- Dragging Logic ---
      function dragStart(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragEnd(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      // --- Tick Update ---
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

        label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
      });
    }

    load();
  }, []);

  return (
    <div className="w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100vh"
        style={{ background: "black", cursor: "grab" }}
      />
    </div>
  );
}
