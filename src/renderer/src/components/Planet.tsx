interface PlanetProps {
  size?: number
  className?: string
  variant?: "earth" | "saturn" | "neptune" | "mars"
}

const PLANET_CONFIG = {
  earth: {
    gradient: "radial-gradient(circle at 30% 30%, #6c9cff 0%, #4a7dd4 25%, #2d5aa0 55%, #1a3566 100%)",
    glow: "rgba(108, 156, 255, 0.4)",
    spots: [
      { x: 20, y: 25, w: 18, h: 14, color: "rgba(100, 180, 130, 0.3)", blur: 3 },
      { x: 55, y: 45, w: 12, h: 10, color: "rgba(80, 160, 120, 0.25)", blur: 2 },
      { x: 35, y: 65, w: 10, h: 8, color: "rgba(110, 190, 140, 0.2)", blur: 2 },
    ],
    hasRing: false,
  },
  saturn: {
    gradient: "radial-gradient(circle at 35% 30%, #f5deb3 0%, #d4a553 30%, #b8860b 60%, #8b6914 100%)",
    glow: "rgba(212, 165, 83, 0.35)",
    spots: [
      { x: 25, y: 35, w: 30, h: 4, color: "rgba(180, 130, 50, 0.3)", blur: 1 },
      { x: 20, y: 50, w: 35, h: 3, color: "rgba(160, 120, 40, 0.25)", blur: 1 },
      { x: 22, y: 62, w: 28, h: 3, color: "rgba(170, 125, 45, 0.2)", blur: 1 },
    ],
    hasRing: true,
  },
  neptune: {
    gradient: "radial-gradient(circle at 28% 28%, #7b9cff 0%, #4a6fd4 30%, #2a4faa 60%, #152d70 100%)",
    glow: "rgba(74, 111, 212, 0.4)",
    spots: [
      { x: 40, y: 40, w: 16, h: 12, color: "rgba(60, 90, 180, 0.4)", blur: 4 },
      { x: 30, y: 60, w: 8, h: 6, color: "rgba(80, 120, 200, 0.3)", blur: 2 },
    ],
    hasRing: false,
  },
  mars: {
    gradient: "radial-gradient(circle at 32% 30%, #e8a060 0%, #c46030 30%, #a04020 60%, #702810 100%)",
    glow: "rgba(196, 96, 48, 0.35)",
    spots: [
      { x: 35, y: 30, w: 14, h: 12, color: "rgba(160, 70, 30, 0.3)", blur: 3 },
      { x: 50, y: 55, w: 10, h: 8, color: "rgba(180, 80, 40, 0.25)", blur: 2 },
      { x: 25, y: 60, w: 8, h: 6, color: "rgba(140, 60, 25, 0.2)", blur: 2 },
    ],
    hasRing: false,
  },
}

function Planet({ size = 120, className = "", variant = "earth" }: PlanetProps) {
  const config = PLANET_CONFIG[variant]

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0" style={{ animation: "planetFloat 6s ease-in-out infinite" }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: config.gradient,
            boxShadow: [
              `0 0 ${size * 0.5}px ${config.glow}`,
              `0 0 ${size}px ${config.glow.replace("0.", "0.")}`,
              `inset -${size * 0.08}px -${size * 0.08}px ${size * 0.25}px rgba(0, 0, 0, 0.5)`,
            ].join(", "),
          }}
        />

        {config.spots.map((spot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.w}%`,
              height: `${spot.h}%`,
              backgroundColor: spot.color,
              filter: `blur(${spot.blur}px)`,
            }}
          />
        ))}

        <div
          className="absolute rounded-full"
          style={{
            left: "18%",
            top: "18%",
            width: "22%",
            height: "18%",
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
            filter: "blur(3px)",
          }}
        />

        {config.hasRing && (
          <div
            className="absolute"
            style={{
              left: "-25%",
              top: "35%",
              width: "150%",
              height: "30%",
              border: `${size * 0.03}px solid rgba(212, 165, 83, 0.5)`,
              borderRadius: "50%",
              transform: "rotateX(70deg) rotateZ(-15deg)",
              boxShadow: `0 0 ${size * 0.1}px rgba(212, 165, 83, 0.3)`,
            }}
          />
        )}

        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  )
}

export default Planet
