"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export type TrendPoint = { label: string; reach: number; engagements: number };

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`);

export function TrendChart({ series }: { series: TrendPoint[] }) {
  const tickEvery = Math.max(1, Math.floor(series.length / 8));
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E63F6" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#2E63F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6F91" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#FF6F91" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10.5, fill: "#98A2B3" }}
            axisLine={false}
            tickLine={false}
            interval={tickEvery}
            minTickGap={8}
          />
          <YAxis tick={{ fontSize: 10.5, fill: "#98A2B3" }} axisLine={false} tickLine={false} tickFormatter={fmt} width={44} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0", boxShadow: "0 8px 24px -14px rgba(16,18,29,.18)" }}
            formatter={(v: number, name) => [v.toLocaleString(), name === "reach" ? "Reach" : "Engagements"]}
          />
          <Area type="monotone" dataKey="reach" stroke="#2E63F6" strokeWidth={2.4} fill="url(#reachGrad)" />
          <Area type="monotone" dataKey="engagements" stroke="#FF6F91" strokeWidth={2.4} fill="url(#engGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
