import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Node {
  id: string
  label: string
  type: string
}

interface Edge {
  source: string
  target: string
}

export default function GenreGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch("http://localhost:5001/api/genre/graph")
      const data = await res.json()

      const width = window.innerWidth
      const height = window.innerHeight

      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      // MAIN GROUP (to apply zoom transforms)
      const g = svg.append("g")

      // --- ZOOM BEHAVIOR ---
      const zoom = d3.zoom()
        .scaleExtent([0.2, 5])        // min/max zoom levels
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
        })

      svg.call(zoom as any)

      // Optional: double click resets zoom
      svg.on("dblclick.zoom", null)  // disable default
      svg.on("dblclick", () => {
        svg.transition().duration(500)
           .call(zoom.transform as any, d3.zoomIdentity)
      })

      // Force simulation
      const simulation = d3.forceSimulation<Node>(data.nodes)
        .force("link", d3.forceLink<Edge>(data.edges).id(d => d.id).distance(140))
        .force("charge", d3.forceManyBody().strength(-260))
        .force("center", d3.forceCenter(width / 2, height / 2))

      // Edges
      const link = g.append("g")
        .attr("stroke", "#777")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .attr("stroke-width", 1.5)

      // Nodes
      const node = g.append("g")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .attr("fill", d => d.type === "genre" ? "#ff9933" : "#4da3ff")
        .call(
          d3.drag<SVGCircleElement, Node>()
            .on("start", dragStart)
            .on("drag", dragged)
            .on("end", dragEnd)
        )

      // Labels
      const label = g.append("g")
        .selectAll("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "13px")
        .attr("dx", 14)
        .attr("dy", 4)
        .attr("fill", "#ccc")

      // Drag helpers
      function dragStart(event: any, d: Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event: any, d: Node) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragEnd(event: any, d: Node) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      // Tick updates
      simulation.on("tick", () => {
        link
          .attr("x1", d => (d.source as any).x)
          .attr("y1", d => (d.source as any).y)
          .attr("x2", d => (d.target as any).x)
          .attr("y2", d => (d.target as any).y)

        node
          .attr("cx", d => d.x!)
          .attr("cy", d => d.y!)

        label
          .attr("x", d => d.x!)
          .attr("y", d => d.y!)
      })
    }

    load()
  }, [])

  return (
    <div className="w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100vh"
        style={{ background: "black", cursor: "grab" }}
      />
    </div>
  )
}
