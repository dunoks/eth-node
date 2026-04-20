import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'address';
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value: string;
  hash: string;
}

export function TransactionGraph({ transactions }: { transactions: Transaction[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || transactions.length === 0) return;

    const width = 600;
    const height = 400;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const nodesMap = new Map<string, Node>();
    const links: Link[] = [];

    transactions.forEach(tx => {
      if (!nodesMap.has(tx.from)) nodesMap.set(tx.from, { id: tx.from, type: 'address' });
      if (!nodesMap.has(tx.to)) nodesMap.set(tx.to, { id: tx.to, type: 'address' });
      links.push({ source: tx.from, target: tx.to, value: tx.value, hash: tx.hash });
    });

    const nodes = Array.from(nodesMap.values());

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "100%");

    // Arrowhead definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "rgba(98, 126, 234, 0.5)")
      .style("stroke", "none");

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(98, 126, 234, 0.2)")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const linkLabel = svg.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("fill", "#627EEA")
      .style("font-size", "8px")
      .style("font-family", "JetBrains Mono")
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .text(d => `${d.hash.slice(0, 6)}... (${d.value}Ξ)`);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", "#050505")
      .attr("stroke", "#627EEA")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text(d => d.id.slice(0, 6) + "...")
      .attr("fill", "rgba(255, 255, 255, 0.4)")
      .style("font-size", "10px")
      .style("font-family", "JetBrains Mono");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      linkLabel
        .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2 - 5);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => simulation.stop();
  }, [transactions]);

  return (
    <div className="w-full h-full bg-black/20 border border-white/5 relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/20 uppercase tracking-widest">
        D3_Force_Layout
      </div>
    </div>
  );
}
