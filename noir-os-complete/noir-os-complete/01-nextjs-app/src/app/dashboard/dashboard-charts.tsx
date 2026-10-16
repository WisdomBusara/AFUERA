"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie,
} from "recharts";

type Datum = { label: string; value: number; color: string };

export function DashboardCharts({
  stageData,
  channelData,
}: {
  stageData: Datum[];
  channelData: Datum[];
}) {
  return (
    <div className="grid gap-4 p-3 md:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-1 px-2 text-[11px] font-semibold text-[var(--afa-ink-3)]">Pipeline by stage</div>
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#98A2B3" }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={54} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(46,99,246,.06)" }} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0", boxShadow: "0 8px 24px -14px rgba(16,18,29,.18)" }} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={26}>
                {stageData.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="mb-1 px-2 text-[11px] font-semibold text-[var(--afa-ink-3)]">By channel</div>
        <div style={{ height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={channelData} dataKey="value" nameKey="label" innerRadius={44} outerRadius={72} paddingAngle={2} stroke="none">
                {channelData.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pt-1">
          {channelData.map((d) => (
            <span key={d.label} className="flex items-center gap-1.5 text-[11px] text-[var(--afa-ink-2)]">
              <span className="afa-sdot" style={{ background: d.color }} /> {d.label}
              <b className="mono">{d.value}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
