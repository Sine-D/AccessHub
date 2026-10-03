import React, { useState } from 'react';
import { LineChart, Table as TableIcon, TrendingUp, DollarSign } from 'lucide-react';
import { MonthlySalesData } from '../../../types/salesAnalytics';

interface MonthlySalesChartProps {
  monthlySales: MonthlySalesData[];
  highContrast?: boolean;
  onAnnounce?: (text: string) => void;
}

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({
  monthlySales,
  highContrast = false,
  onAnnounce,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [activeSeries, setActiveSeries] = useState<{ gmv: boolean; commission: boolean; orders: boolean }>({
    gmv: true,
    commission: true,
    orders: true,
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (monthlySales.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 text-center text-slate-500 text-xs font-bold border border-slate-200 dark:border-slate-700">
        No sales data available for the selected filter criteria.
      </div>
    );
  }

  const maxSales = Math.max(...monthlySales.map((m) => m.salesAmount), 1000);
  const maxOrders = Math.max(...monthlySales.map((m) => m.orderCount), 1);
  const maxCommission = Math.max(...monthlySales.map((m) => m.commission), 100);

  // Dimensions for multi-series SVG chart with alternating column background bands
  const width = 640;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const count = monthlySales.length;
  const colWidth = chartWidth / Math.max(count, 1);

  // Coordinates for 3 series (Cyan GMV, Orange Commission, Blue Order Volume)
  const gmvPoints = monthlySales.map((m, idx) => ({
    x: paddingLeft + (idx + 0.5) * colWidth,
    y: height - paddingBottom - (m.salesAmount / maxSales) * chartHeight,
    data: m,
    index: idx,
  }));

  const commPoints = monthlySales.map((m, idx) => ({
    x: paddingLeft + (idx + 0.5) * colWidth,
    y: height - paddingBottom - (m.commission / maxSales) * chartHeight,
    data: m,
    index: idx,
  }));

  const orderPoints = monthlySales.map((m, idx) => ({
    x: paddingLeft + (idx + 0.5) * colWidth,
    y: height - paddingBottom - ((m.orderCount * (maxSales / (maxOrders * 2))) / maxSales) * chartHeight,
    data: m,
    index: idx,
  }));

  const makePath = (pts: { x: number; y: number }[]) =>
    pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const gmvPath = makePath(gmvPoints);
  const commPath = makePath(commPoints);
  const orderPath = makePath(orderPoints);

  const handlePointSelect = (m: MonthlySalesData, index: number) => {
    setHoveredIndex(index);
    const text = `${m.month} ${m.year}: LKR ${m.salesAmount.toLocaleString()} GMV, LKR ${m.commission.toLocaleString()} 10% commission, ${m.orderCount} orders.`;
    if (onAnnounce) onAnnounce(text);
  };

  // Generate Y-axis grid ticks (e.g. 1000, 2000, 3000... up to maxSales)
  const gridTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => ({
    ratio,
    value: Math.round(ratio * maxSales),
    y: height - paddingBottom - ratio * chartHeight,
  }));

  return (
    <div
      role="region"
      aria-label="Multi-Series Line Chart with Alternating Shaded Column Bands"
      className={`p-6 rounded-3xl border transition-all ${
        highContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      {/* Header & Series Legend Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-extrabold">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">Multi-Series Sales Line Chart</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Comparative revenue timeline with alternating vertical column shading bands.
            </p>
          </div>
        </div>

        {/* Series Legends & View Switcher */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-extrabold">
            {/* Cyan Series (GMV) */}
            <button
              onClick={() => setActiveSeries((prev) => ({ ...prev, gmv: !prev.gmv }))}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSeries.gmv ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
              <span>Gross Sales (GMV)</span>
            </button>

            {/* Orange Series (Commission) */}
            <button
              onClick={() => setActiveSeries((prev) => ({ ...prev, commission: !prev.commission }))}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSeries.commission ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <span>10% Revenue Share</span>
            </button>

            {/* Blue Series (Orders) */}
            <button
              onClick={() => setActiveSeries((prev) => ({ ...prev, orders: !prev.orders }))}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSeries.orders ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
              <span>Order Volume</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'chart' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Visual Chart
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1 ${
                viewMode === 'table' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Multi-Line Chart View */}
      {viewMode === 'chart' ? (
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
            {/* 1. Alternating Shaded Vertical Background Bands (Exact Match to User Reference Image) */}
            {monthlySales.map((m, idx) => {
              const bandX = paddingLeft + idx * colWidth;
              const isEven = idx % 2 === 0;
              return (
                <rect
                  key={`band-${idx}`}
                  x={bandX}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight}
                  fill={
                    highContrast
                      ? isEven
                        ? '#1e293b'
                        : '#000000'
                      : isEven
                      ? 'rgba(241, 245, 249, 0.85)' // Light alternating grey band
                      : 'rgba(255, 255, 255, 1)'
                  }
                  className="dark:fill-slate-800/40 dark:even:fill-slate-900/40 transition-all"
                />
              );
            })}

            {/* 2. Y-Axis Horizontal Gridlines and Numerical Values (1000, 2000, 3000...) */}
            {gridTicks.map((tick, idx) => (
              <g key={`grid-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={tick.y}
                  x2={width - paddingRight}
                  y2={tick.y}
                  stroke={highContrast ? '#ffff0044' : '#cbd5e1'}
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={tick.y + 3}
                  fill={highContrast ? '#ffff00' : '#64748b'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {tick.value.toLocaleString()}
                </text>
              </g>
            ))}

            {/* 3. Cyan Multi-Line Series: Gross Sales (GMV) */}
            {activeSeries.gmv && (
              <>
                <path
                  d={gmvPath}
                  fill="none"
                  stroke={highContrast ? '#ffff00' : '#06b6d4'} // Vibrant Cyan
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {gmvPoints.map((pt) => (
                  <circle
                    key={`gmv-pt-${pt.index}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === pt.index ? 6.5 : 4}
                    fill={highContrast ? '#ffff00' : '#06b6d4'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onClick={() => handlePointSelect(pt.data, pt.index)}
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </>
            )}

            {/* 4. Orange Multi-Line Series: 10% Platform Revenue */}
            {activeSeries.commission && (
              <>
                <path
                  d={commPath}
                  fill="none"
                  stroke={highContrast ? '#ff9900' : '#f97316'} // Vibrant Orange
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {commPoints.map((pt) => (
                  <circle
                    key={`comm-pt-${pt.index}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === pt.index ? 6 : 3.5}
                    fill={highContrast ? '#ff9900' : '#f97316'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onClick={() => handlePointSelect(pt.data, pt.index)}
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </>
            )}

            {/* 5. Blue Multi-Line Series: Order Volume */}
            {activeSeries.orders && (
              <>
                <path
                  d={orderPath}
                  fill="none"
                  stroke={highContrast ? '#38bdf8' : '#3b82f6'} // Vibrant Blue
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {orderPoints.map((pt) => (
                  <circle
                    key={`order-pt-${pt.index}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === pt.index ? 6 : 3.5}
                    fill={highContrast ? '#38bdf8' : '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onClick={() => handlePointSelect(pt.data, pt.index)}
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </>
            )}

            {/* 6. X-Axis Category / Month Labels (Jan, Feb, Mar, Apr...) */}
            {monthlySales.map((m, idx) => {
              const labelX = paddingLeft + (idx + 0.5) * colWidth;
              return (
                <text
                  key={`label-${idx}`}
                  x={labelX}
                  y={height - 10}
                  fill={highContrast ? '#ffff00' : '#334155'}
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {m.month}
                </text>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredIndex !== null && gmvPoints[hoveredIndex] && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 z-20 pointer-events-none animate-fadeIn">
              <div className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 flex justify-between space-x-4">
                <span>{gmvPoints[hoveredIndex].data.month} {gmvPoints[hoveredIndex].data.year}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                  {gmvPoints[hoveredIndex].data.orderCount} Orders
                </span>
              </div>
              <div className="flex items-center justify-between text-xs space-x-4">
                <span className="text-cyan-300 font-bold">● Gross Sales (GMV):</span>
                <strong className="text-white font-mono">LKR {gmvPoints[hoveredIndex].data.salesAmount.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between text-xs space-x-4">
                <span className="text-amber-400 font-bold">● 10% Commission:</span>
                <strong className="text-amber-300 font-mono">LKR {gmvPoints[hoveredIndex].data.commission.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Data Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold">
                <th className="py-2.5 px-3">Month / Year</th>
                <th className="py-2.5 px-3">Gross Sales (GMV LKR)</th>
                <th className="py-2.5 px-3">Order Count</th>
                <th className="py-2.5 px-3">10% Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlySales.map((m) => (
                <tr key={`${m.month}-${m.year}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold">
                  <td className="py-3 px-3 text-slate-900 dark:text-white">{m.month} {m.year}</td>
                  <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400">LKR {m.salesAmount.toLocaleString()}</td>
                  <td className="py-3 px-3">{m.orderCount} orders</td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400">LKR {m.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
