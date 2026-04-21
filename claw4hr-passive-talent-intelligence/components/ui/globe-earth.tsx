import React from "react";

interface GlobeEarthProps {
  size?: number;
}

const GlobeEarth: React.FC<GlobeEarthProps> = ({ size = 320 }) => {
  const textureWidth = size * 2;

  return (
    <>
      <style>{`
        @keyframes earthRotate-${size} {
          0%   { background-position: 0 center; }
          100% { background-position: ${textureWidth}px center; }
        }
        @keyframes twinkling      { 0%,100%{opacity:0.1}50%{opacity:1} }
        @keyframes twinkling-slow { 0%,100%{opacity:0.1}50%{opacity:1} }
        @keyframes twinkling-long { 0%,100%{opacity:0.1}50%{opacity:1} }
        @keyframes twinkling-fast { 0%,100%{opacity:0.1}50%{opacity:1} }
      `}</style>
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: size,
          height: size,
          backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
          backgroundSize: `${textureWidth}px ${size}px`,
          backgroundPosition: "0 center",
          animation: `earthRotate-${size} 30s linear infinite`,
          boxShadow: [
            `0 0 ${size * 0.25}px rgba(255,107,107,0.12)`,
            `0 0 ${size * 0.5}px rgba(100,150,255,0.08)`,
            `-5px 0 ${size * 0.04}px #c3f4ff inset`,
            `${size * 0.05}px 2px ${size * 0.1}px #000 inset`,
            `-${size * 0.08}px -2px ${size * 0.13}px #c3f4ff88 inset`,
            `${size * 0.9}px 0 ${size * 0.16}px #00000077 inset`,
            `${size * 0.58}px 0 ${size * 0.14}px #000000aa inset`,
          ].join(", "),
        }}
      />
    </>
  );
};

export default GlobeEarth;
