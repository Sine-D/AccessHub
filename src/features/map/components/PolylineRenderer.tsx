import React from 'react';
import type { LatLngPoint } from '../../../services/directionsController';

interface PolylineRendererProps {
  points: LatLngPoint[];
  color?: string; // e.g. '#2563eb' (Electric Blue) or '#059669' (Emerald)
  strokeWidth?: number;
  outlineColor?: string;
  outlineWidth?: number;
  accessibilityLabel?: string;
}

export const PolylineRenderer: React.FC<PolylineRendererProps> = ({
  points,
  color = '#2563eb', // High-contrast Electric Blue
  strokeWidth = 6,
  outlineColor = '#000000', // High-contrast black outline
  outlineWidth = 10,
  accessibilityLabel = 'High contrast step-free navigation polyline route',
}) => {
  if (!points || points.length < 2) return null;

  // Convert lat/lng array to SVG points path string
  // Map lat/lng delta coordinates onto SVG viewport
  const minLat = Math.min(...points.map((p) => p.lat));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const minLng = Math.min(...points.map((p) => p.lng));
  const maxLng = Math.max(...points.map((p) => p.lng));

  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;

  const svgWidth = 400;
  const svgHeight = 220;
  const padding = 20;

  const pathData = points
    .map((p, idx) => {
      const x = padding + ((p.lng - minLng) / lngSpan) * (svgWidth - padding * 2);
      const y = svgHeight - (padding + ((p.lat - minLat) / latSpan) * (svgHeight - padding * 2));
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className="relative h-48 w-full overflow-hidden rounded-2xl border border-blue-200 bg-slate-900 p-2 shadow-md dark:border-blue-800"
      role="img"
      aria-label={accessibilityLabel}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center space-x-2 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span>Polyline Overlay (AC-231)</span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Outer Contrast Outline Path (AC-231 high-contrast border) */}
        <path
          d={pathData}
          fill="none"
          stroke={outlineColor}
          strokeWidth={outlineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner High-Contrast Polyline Path */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Origin & Destination Pin Markers */}
        {points.length > 0 && (
          <>
            <circle
              cx={padding + ((points[0].lng - minLng) / lngSpan) * (svgWidth - padding * 2)}
              cy={svgHeight - (padding + ((points[0].lat - minLat) / latSpan) * (svgHeight - padding * 2))}
              r="7"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={padding + ((points[points.length - 1].lng - minLng) / lngSpan) * (svgWidth - padding * 2)}
              cy={svgHeight - (padding + ((points[points.length - 1].lat - minLat) / latSpan) * (svgHeight - padding * 2))}
              r="8"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    </div>
  );
};

