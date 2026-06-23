"use client";

import { useState } from "react";
import Card from "@mui/material/Card";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/constants";
import type { CurrencyCode, FinanceAggregate } from "@/lib/types";

const colors = ["#b76e79", "#3f6f78", "#71816d", "#11110f", "#c6a15b", "#876445", "#727272"];

function tooltipFormatter(value: number, _name: string, item: { payload?: { currency?: CurrencyCode } }) {
  return formatCurrency(value, item.payload?.currency ?? "SGD");
}

export function FinanceCharts({ aggregates }: { aggregates: FinanceAggregate[] }) {
  const [mode, setMode] = useState<"week" | "month">("week");

  return (
    <Card className="border border-neutral-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Finance overview</p>
          <h2 className="mt-2 font-serif text-4xl">Local currency trends</h2>
        </div>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, value) => value && setMode(value)}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {aggregates.map((aggregate, index) => {
          const timeline = mode === "week" ? aggregate.week : aggregate.month;
          return (
            <div key={aggregate.profile.id} className="border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {aggregate.profile.display_name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatCurrency(aggregate.total, aggregate.currency)} this period
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  {aggregate.currency}
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={58} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.18}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aggregate.categories}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {aggregate.categories.map((entry, colorIndex) => (
                        <Cell
                          key={entry.category}
                          fill={colors[colorIndex % colors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 border border-neutral-200 p-4">
        <div className="mb-4">
          <p className="eyebrow">Monthly bars</p>
          <h3 className="mt-2 font-serif text-3xl">Spending by month</h3>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {aggregates.map((aggregate, index) => (
            <div key={`${aggregate.profile.id}-bars`} className="min-h-64">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {aggregate.profile.display_name}
                </p>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  {aggregate.currency}
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregate.month}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={58} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar
                      dataKey="total"
                      radius={[4, 4, 0, 0]}
                      fill={colors[(index + 2) % colors.length]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
