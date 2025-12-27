// src/components/TokenChart.jsx
import React from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import useChartData from "../hooks/useChartData";

export default function TokenChart({ contract, timeframe = "5m", height = 280 }) {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  const seriesRef = React.useRef(null);
  const data = useChartData(contract, timeframe);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const chart = createChart(el, {
      height,
      layout: { background: { color: "rgba(0,0,0,0)" }, textColor: "rgba(255,255,255,0.8)" },
      grid: { vertLines: { color: "rgba(0,229,255,0.12)" }, horzLines: { color: "rgba(255,28,247,0.12)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
      timeScale: { borderColor: "rgba(255,255,255,0.12)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    });
    const line = chart.addLineSeries({ lineWidth: 2, color: "#00E5FF" });
    chartRef.current = chart;
    seriesRef.current = line;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) chart.applyOptions({ width: e.contentRect.width });
    });
    ro.observe(el);

    return () => { ro.disconnect(); chart.remove(); };
  }, [height]);

  React.useEffect(() => {
    if (!seriesRef.current || !Array.isArray(data)) return;
    const points = data.map((d) => ({
      time: Math.floor(((d?.t ?? d?.time) ?? Date.now()) / 1000),
      value: Number(d?.c ?? d?.price ?? d?.v ?? 0),
    })).filter((p) => Number.isFinite(p.value));
    seriesRef.current.setData(points);
    if (chartRef.current) chartRef.current.timeScale().fitContent();
  }, [data]);

  return <div ref={ref} className="w-full rounded-3xl border border-[rgba(255,28,247,.35)] bg-black/50" />;
}
