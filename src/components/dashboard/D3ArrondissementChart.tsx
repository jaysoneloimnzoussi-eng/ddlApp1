import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatCfa } from '../../services/crypto';
import { useApp } from '../../context/AppContext';

interface DataItem {
  nom: string;
  montantRecettes: number;
  nombreEtabs: number;
  infractions: number;
}

interface Props {
  data: DataItem[];
}

export const D3ArrondissementChart: React.FC<Props> = ({ data }) => {
  const { theme } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const isLight = theme === 'light';
    const container = containerRef.current;
    const width = container.clientWidth || 550;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 40, left: 110 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.nom))
      .range([0, innerHeight])
      .padding(0.28);

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.montantRecettes) || 100000) * 1.15])
      .nice()
      .range([0, innerWidth]);

    // Gradient definition
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'd3-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.85);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 1);

    // Axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(5)
      .tickFormat((d) => `${(Number(d) / 1000).toFixed(0)}k`);

    const yAxis = d3.axisLeft(y).tickSize(0);

    // Y Axis group
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', isLight ? '#334155' : '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif');

    g.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155');

    // X Axis group
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', isLight ? '#64748b' : '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    g.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155');

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', isLight ? '#f1f5f9' : '#1e293b')
      .attr('stroke-dasharray', '2,2');

    // Bars with smooth D3 animation
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.nom) || 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#d3-bar-gradient)')
      .attr('width', 0)
      .transition()
      .duration(900)
      .delay((_, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => x(d.montantRecettes));

    // Value Labels
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('y', (d) => (y(d.nom) || 0) + y.bandwidth() / 2 + 4)
      .attr('x', (d) => x(d.montantRecettes) + 8)
      .attr('fill', isLight ? '#0284c7' : '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('opacity', 0)
      .text((d) => formatCfa(d.montantRecettes))
      .transition()
      .duration(900)
      .delay((_, i) => i * 100 + 400)
      .attr('opacity', 1);

    // Infraction warning dots if infractions exist
    g.selectAll('.alert-badge')
      .data(data.filter((d) => d.infractions > 0))
      .enter()
      .append('circle')
      .attr('class', 'alert-badge')
      .attr('cx', -100)
      .attr('cy', (d) => (y(d.nom) || 0) + y.bandwidth() / 2)
      .attr('r', 3.5)
      .attr('fill', '#f59e0b');
  }, [data, theme]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full overflow-visible" />
    </div>
  );
};
