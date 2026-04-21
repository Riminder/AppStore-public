"use client";

interface ScoreRingProps {
  score: number;       // 0-100, -1 = loading
  size?: number;       // diameter in px, default 56
  strokeWidth?: number;
}

function scoreColor(score: number): string {
  if (score < 0) return "#6b7280";
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#f43f5e";
}

export default function ScoreRing({ score, size = 56, strokeWidth = 4 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = score < 0 ? circumference : circumference - (score / 100) * circumference;
  const color = scoreColor(score);
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10"
        />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={score < 0 ? circumference * 0.75 : offset}
          style={{
            transition: "stroke-dashoffset 1s ease-out, stroke 0.3s",
            ...(score < 0 && { animation: "spin-slow 1.5s linear infinite" }),
          }}
        />
      </svg>
      {/* Score text */}
      <span
        className="absolute font-mono font-bold"
        style={{
          fontSize: size * 0.22,
          color: score < 0 ? "#6b7280" : color,
        }}
      >
        {score < 0 ? "…" : `${score}%`}
      </span>
    </div>
  );
}
