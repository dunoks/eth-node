import React, { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ 
        width: width || 600, 
        height: height || 400 
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || transactions.length === 0) return;

    const { width, height } = dimensions;

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

    // Zoom setup
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

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
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(40));

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "tx-link")
      .attr("stroke", "rgba(98, 126, 234, 0.2)")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)")
      .style("transition", "stroke 0.2s, stroke-opacity 0.2s")
      .style("cursor", "crosshair")
      .on("mouseenter", (event, d: any) => {
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="margin-bottom: 2px; opacity: 0.5;">TX_RELATIONSHIP</div>
            <div style="font-weight: bold; margin-bottom: 4px; color: #ffffff;">${d.hash}</div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 2px;">
              <span style="opacity: 0.6;">VALUE:</span>
              <span style="color: #627EEA;">${d.value} Ξ</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
              <span style="opacity: 0.6;">GAS PRICE:</span>
              <span style="color: #10b981;">${parseFloat(d.gasPrice).toFixed(2)} Gwei</span>
            </div>
            <div style="font-size: 8px; opacity: 0.3; border-top: 1px solid rgba(98, 126, 234, 0.2); padding-top: 4px;">EDGE_INSPECTION_MODE</div>
          `);
        
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("stroke", "rgba(98, 126, 234, 0.8)")
          .attr("stroke-width", 3);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseleave", (event) => {
        tooltip.style("visibility", "hidden");
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("stroke", "rgba(98, 126, 234, 0.2)")
          .attr("stroke-width", 1.5);
      });

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("class", "tx-label")
      .attr("fill", "#627EEA")
      .attr("stroke", "#000000")
      .attr("stroke-width", "0.2px")
      .style("font-size", "8px")
      .style("font-weight", "bold")
      .style("font-family", "JetBrains Mono")
      .style("text-anchor", "middle")
      .style("cursor", "crosshair")
      .style("opacity", 0.7)
      .style("transition", "opacity 0.2s, fill 0.2s")
      .text(d => `${d.hash.slice(0, 6)}... [${d.value} Ξ] @ ${parseFloat(d.gasPrice).toFixed(1)} gwei`)
      .on("mouseenter", (event, d: any) => {
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="margin-bottom: 2px; opacity: 0.5;">TX_RELATIONSHIP</div>
            <div style="font-weight: bold; margin-bottom: 4px; color: #ffffff;">${d.hash}</div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 2px;">
              <span style="opacity: 0.6;">VALUE:</span>
              <span style="color: #627EEA;">${d.value} Ξ</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
              <span style="opacity: 0.6;">GAS PRICE:</span>
              <span style="color: #10b981;">${parseFloat(d.gasPrice).toFixed(2)} Gwei</span>
            </div>
            <div style="font-size: 8px; opacity: 0.3; border-top: 1px solid rgba(98, 126, 234, 0.2); padding-top: 4px;">LABEL_INSPECTION_MODE</div>
          `);
        
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("fill", "#ffffff")
          .style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseleave", (event) => {
        tooltip.style("visibility", "hidden");
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("fill", "#627EEA")
          .style("opacity", 0.7);
      });

    // Tooltip definition
    const tooltip = d3.select("body").append("div")
      .attr("class", "tx-graph-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(5, 5, 5, 0.95)")
      .style("border", "1px solid #627EEA")
      .style("color", "#627EEA")
      .style("padding", "6px 12px")
      .style("font-family", "JetBrains Mono")
      .style("font-size", "10px")
      .style("z-index", "1000")
      .style("pointer-events", "none")
      .style("box-shadow", "0 0 20px rgba(98, 126, 234, 0.2)");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "tx-node")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d: any) => {
        // Show tooltip
        tooltip
          .style("visibility", "visible")
      .html(`
        <div style="margin-bottom: 2px; opacity: 0.5;">ADDRESS_NODE</div>
        <div style="font-weight: bold; margin-bottom: 4px;">${d.id}</div>
        <div style="font-size: 8px; opacity: 0.3; border-top: 1px solid rgba(98, 126, 234, 0.2); pt-1;">CURSOR_FOLLOW_ACTIVE</div>
      `);

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
      .on("mousemove", (event) => {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseleave", (event) => {
        // Hide tooltip
        tooltip.style("visibility", "hidden");

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
        .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2 - 8)
        .attr("transform", d => {
          const x1 = (d.source as any).x;
          const y1 = (d.source as any).y;
          const x2 = (d.target as any).x;
          const y2 = (d.target as any).y;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Normalize angle to keep text upright (reading left-to-right)
          const normalizedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
          
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;
          return `rotate(${normalizedAngle}, ${centerX}, ${centerY})`;
        });

      node
        .attr("transform", d => {
          // Clamp nodes to viewport boundaries with padding
          const r = 20;
          d.x = Math.max(r, Math.min(width - r, d.x || 0));
          d.y = Math.max(r, Math.min(height - r, d.y || 0));
          return `translate(${d.x},${d.y})`;
        });
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

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [transactions, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black/20 border border-white/5 relative overflow-hidden group">
      <svg ref={svgRef} className="w-full h-full cursor-move" />
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
        <div className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">SCROLL_TO_ZOOM</div>
        <div className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">DRAG_TO_PAN</div>
      </div>
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/20 uppercase tracking-widest">
        D3_Force_Layout
      </div>
    </div>
  );
}
