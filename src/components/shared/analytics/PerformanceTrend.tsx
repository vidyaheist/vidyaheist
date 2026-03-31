"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceTrendProps {
  data: { date: string; score: number; testName: string }[];
}

export function PerformanceTrend({ data }: PerformanceTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
        <p className="font-medium italic text-lg">No data available yet</p>
        <p className="text-sm">Start taking tests to see your performance trend!</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.6 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.6 }}
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg shadow-xl p-3">
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Test Attempt</p>
                    <p className="text-sm font-semibold mb-1">{payload[0].payload.testName}</p>
                    <p className="text-xl font-bold text-primary">{payload[0].value}% <span className="text-xs font-normal text-muted-foreground">Accuracy</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1">{payload[0].payload.date}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#2563eb" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScore)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
