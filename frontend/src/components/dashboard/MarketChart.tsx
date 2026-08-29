"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { money } from "@/lib/market-data";

export default function MarketChart({
  values,
  symbol,
  pending = false,
  dark = false,
}: {
  values: number[];
  symbol: string;
  pending?: boolean;
  dark?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const data = useMemo(
    () => values.map((price, index) => ({ price, sample: index + 1 })),
    [values],
  );
  if (values.length < 2)
    return (
      <div className="cc-chart-empty" role="status">
        <ChartNoAxesCombined size={32} strokeWidth={1.2} aria-hidden="true" />
        <strong>
          {pending ? "Loading price history" : "Price history unavailable"}
        </strong>
        <span>
          {pending
            ? "Requesting the provider’s 7-day snapshot."
            : "The chart appears when valid historical prices are available."}
        </span>
      </div>
    );
  return (
    <figure
      className={`cc-chart ${dark ? "cc-chart-dark" : ""}`}
      aria-label={`${symbol} seven-day price history in US dollars, ${values.length} provider samples`}
    >
      <div className="cc-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 8, bottom: 4, left: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={dark ? "#91BCE0" : "#2F78B7"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={dark ? "#91BCE0" : "#2F78B7"}
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke={dark ? "#FFFFFF18" : "#E5E8E2"}
              strokeDasharray="3 5"
            />
            <YAxis
              domain={["auto", "auto"]}
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={70}
              tick={{ fill: dark ? "#CAD7CE" : "#656C63", fontSize: 11 }}
              tickFormatter={(value) => money(Number(value), true)}
            />
            <Tooltip
              cursor={{
                stroke: dark ? "#91BCE0" : "#2F78B7",
                strokeDasharray: "3 4",
              }}
              contentStyle={{
                background: "#FFFFFF",
                color: "#152F24",
                border: "1px solid #D9DED5",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelFormatter={(_, items) =>
                `Provider sample ${items?.[0]?.payload?.sample ?? ""}`
              }
              formatter={(value) => [money(Number(value)), "Price (USD)"]}
            />
            <Area
              type="linear"
              dataKey="price"
              stroke={dark ? "#91BCE0" : "#2F78B7"}
              strokeWidth={2}
              fill={`url(#${id})`}
              isAnimationActive={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption>
        <span>7-day provider history</span>
        <span>USD · indicative prices, not execution quotes</span>
      </figcaption>
    </figure>
  );
}
