import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
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
  gasPrice: string;
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
      links.push({ source: tx.from, target: tx.to, value: tx.value, hash: tx.hash, gasPrice: tx.gasPrice });
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
      .attr("class", "tx-link")
      .attr("stroke", "rgba(98, 126, 234, 0.2)")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)")
      .style("transition", "stroke 0.2s, stroke-opacity 0.2s");

    const linkLabel = svg.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("class", "tx-label")
      .attr("fill", "#627EEA")
      .style("font-size", "7px")
      .style("font-family", "JetBrains Mono")
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", 0.6)
      .style("transition", "opacity 0.2s")
      .text(d => `${d.hash.slice(0, 4)}.. ${d.value}Ξ @ ${parseFloat(d.gasPrice).toFixed(1)}gwei`);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "tx-node")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d: any) => {
        // Highlight this node
        d3.select(event.currentTarget).select("circle")
          .transition().duration(200)
          .attr("r", 9)
          .attr("fill", "#627EEA");
        
        d3.select(event.currentTarget).select("text")
          .transition().duration(200)
          .attr("fill", "#ffffff")
          .style("font-size", "11px");

        // Dim other nodes
        svg.selectAll(".tx-node").filter((n: any) => n.id !== d.id)
          .transition().duration(200)
          .style("opacity", 0.3);

        // Highlight connected links
        svg.selectAll(".tx-link")
          .transition().duration(200)
          .attr("stroke", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "rgba(98, 126, 234, 0.8)" : "rgba(255, 255, 255, 0.05)")
          .attr("stroke-width", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1);

        svg.selectAll(".tx-label")
          .transition().duration(200)
          .style("opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05);
      })
      .on("mouseleave", (event) => {
        // Reset node
        d3.select(event.currentTarget).select("circle")
          .transition().duration(200)
          .attr("r", 6)
          .attr("fill", "#050505");
        
        d3.select(event.currentTarget).select("text")
          .transition().duration(200)
          .attr("fill", "rgba(255, 255, 255, 0.4)")
          .style("font-size", "10px");

        // Reset all
        svg.selectAll(".tx-node").transition().duration(200).style("opacity", 1);
        svg.selectAll(".tx-link")
          .transition().duration(200)
          .attr("stroke", "rgba(98, 126, 234, 0.2)")
          .attr("stroke-width", 1.5);
        svg.selectAll(".tx-label").transition().duration(200).style("opacity", 0.6);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", "#050505")
      .attr("stroke", "#627EEA")
      .attr("stroke-width", 2)
      .style("transition", "r 0.2s, fill 0.2s");

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
