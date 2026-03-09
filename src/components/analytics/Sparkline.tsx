import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline = ({ data, color = 'hsl(var(--primary))', height = 32 }: SparklineProps) => {
  if (data.length < 2) return null;

  const chartData = data.map((value, i) => ({ v: value, i }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
