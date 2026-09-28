import React, { useState } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';

export interface PieCategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface Exploded3DPieChartProps {
  data: PieCategoryData[];
  highContrast?: boolean;
}

export const Exploded3DPieChart: React.FC<Exploded3DPieChartProps> = ({
  data,
  highContrast = false,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs font-bold">
        No category breakdown data available.
      </div>
    );
  }

  const colors = [
    { top: '#3b82f6', side: '#1d4ed8' }, // Blue (like Canada 30.1%)
    { top: '#ef4444', side: '#b91c1c' }, // Red (like Russia 14.9%)
    { top: '#a855f7', side: '#7e22ce' }, // Purple (like Japan 4.8%)
    { top: '#10b981', side: '#047857' }, // Green (like Australia 16.6%)
    { top: '#f59e0b', side: '#b45309' }, // Orange (like Brazil 6.7%)
    { top: '#06b6d4', side: '#0e7490' }, // Cyan (like India 12.7%)
    { top: '#84cc16', side: '#4d7c0f' }, // Lime (like China 8.5%)
  ];

  // Dimensions & 3D Center Settings
  const width = 560;
  const height = 320;
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const rx = 100; // Elliptical 3D horizontal radius
  const ry = 60;  // Elliptical 3D vertical radius
  const depth = 22; // 3D Slice Depth thickness

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  // Compute angles for 3D slices and leader callout line positions
  let cumulativeAngle = 0;
  const slices = data.map((item, index) => {
    const startAngle = cumulativeAngle;
    const sliceAngle = (item.amount / Math.max(totalAmount, 1)) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    cumulativeAngle = endAngle;

    // Explode distance outward
    const explodeDist = hoveredCategory === item.category ? 14 : 7;
    const explodeX = Math.cos(midAngle) * explodeDist;
    const explodeY = Math.sin(midAngle) * explodeDist;

    // Edge point on 3D slice curve
    const edgeX = centerX + explodeX + rx * Math.cos(midAngle);
    const edgeY = centerY + explodeY + ry * Math.sin(midAngle);

    // Leader line knee point & horizontal text end point (exact match to Right Reference Image)
    const isRight = Math.cos(midAngle) >= 0;
    const kneeX = edgeX + (isRight ? 35 : -35);
    const kneeY = edgeY + (Math.sin(midAngle) >= 0 ? 15 : -15);
    const textX = kneeX + (isRight ? 25 : -25);

    return {
      ...item,
      color: colors[index % colors.length],
      startAngle,
      endAngle,
      midAngle,
      explodeX,
      explodeY,
      edgeX,
      edgeY,
      kneeX,
      kneeY,
      textX,
      isRight,
      index,
    };
  });

  // Helper to generate SVG elliptical arc path
  const makeArcPath = (
    cx: number,
    cy: number,
    startA: number,
    endA: number,
    radiusX: number,
    radiusY: number
  ) => {
    const x1 = cx + radiusX * Math.cos(startA);
    const y1 = cy + radiusY * Math.sin(startA);
    const x2 = cx + radiusX * Math.cos(endA);
    const y2 = cy + radiusY * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div
      role="region"
      aria-label="3D Exploded Pie Chart with Leader Callout Pointer Lines"
      className={`p-6 rounded-3xl border transition-all ${
        highContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <PieChartIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Category Market Share (3D Exploded Pie Chart)
        </h3>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80 overflow-visible">
          {/* 1. 3D Slice Depth Shadows (Bottom 3D Thickness Extrusion) */}
          {slices.map((s) => {
            const topPath = makeArcPath(
              centerX + s.explodeX,
              centerY + s.explodeY,
              s.startAngle,
              s.endAngle,
              rx,
              ry
            );
            const bottomPath = makeArcPath(
              centerX + s.explodeX,
              centerY + s.explodeY + depth,
              s.startAngle,
              s.endAngle,
              rx,
              ry
            );
            return (
              <g key={`3d-depth-${s.category}`}>
                <path d={bottomPath} fill={s.color.side} opacity="0.85" />
              </g>
            );
          })}

          {/* 2. Main 3D Exploded Top Pie Slices */}
          {slices.map((s) => {
            const path = makeArcPath(
              centerX + s.explodeX,
              centerY + s.explodeY,
              s.startAngle,
              s.endAngle,
              rx,
              ry
            );
            const isHovered = hoveredCategory === s.category;
            return (
              <path
                key={`slice-${s.category}`}
                d={path}
                fill={highContrast ? '#ffff00' : s.color.top}
                stroke={highContrast ? '#000000' : '#ffffff'}
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onMouseEnter={() => setHoveredCategory(s.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            );
          })}

          {/* 3. Leader Pointer Callout Lines & External Text Labels (Matching Reference Image) */}
          {slices.map((s) => (
            <g key={`callout-${s.category}`}>
              {/* Leader Polyline extending out from slice */}
              <polyline
                points={`${s.edgeX},${s.edgeY} ${s.kneeX},${s.kneeY} ${s.textX},${s.kneeY}`}
                fill="none"
                stroke={highContrast ? '#ffff00' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={s.edgeX}
                cy={s.edgeY}
                r="3"
                fill={s.color.top}
                stroke="#ffffff"
                strokeWidth="1"
              />

              {/* Callout Label Box */}
              <text
                x={s.textX + (s.isRight ? 6 : -6)}
                y={s.kneeY - 4}
                fill={highContrast ? '#ffff00' : '#0f172a'}
                fontSize="11"
                fontWeight="800"
                textAnchor={s.isRight ? 'start' : 'end'}
                className="dark:fill-white"
              >
                {s.category} {s.percentage}%
              </text>
              <text
                x={s.textX + (s.isRight ? 6 : -6)}
                y={s.kneeY + 10}
                fill={highContrast ? '#ffff00' : '#64748b'}
                fontSize="9"
                fontWeight="bold"
                textAnchor={s.isRight ? 'start' : 'end'}
              >
                LKR {s.amount.toLocaleString()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

