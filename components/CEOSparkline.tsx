"use client";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function CEOSparkline({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1fd9c4" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#08beab" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis hide domain={[0, (dataMax: number) => Math.max(2, dataMax + 1)]} />
        <Tooltip
          cursor={{ stroke: "var(--accent-violet)", strokeOpacity: 0.2 }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border-light)",
            borderRadius: 12,
            fontSize: 12,
            padding: "6px 10px",
          }}
          labelStyle={{ color: "var(--text-tertiary)" }}
          formatter={(v: any) => [v, "Completed"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="url(#sparkStroke)"
          strokeWidth={2.5}
          fill="url(#sparkGradient)"
          dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
