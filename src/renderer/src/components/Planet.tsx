interface PlanetProps {
  size?: number
  className?: string
}

function Planet({ size = 120, className = "" }: PlanetProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #6c9cff 0%, #4a7dd4 30%, #2d5aa0 60%, #1a3566 100%)",
          boxShadow:
            "0 0 60px rgba(108, 156, 255, 0.4), 0 0 120px rgba(108, 156, 255, 0.2), inset -10px -10px 30px rgba(0, 0, 0, 0.5)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at 70% 60%, rgba(168, 123, 255, 0.6) 0%, transparent 40%)",
        }}
      />
      <div
        className="absolute rounded-full bg-white/20"
        style={{
          width: size * 0.15,
          height: size * 0.15,
          top: "20%",
          left: "25%",
          filter: "blur(2px)",
        }}
      />
      <div
        className="absolute rounded-full bg-white/10"
        style={{
          width: size * 0.08,
          height: size * 0.08,
          top: "45%",
          left: "35%",
          filter: "blur(1px)",
        }}
      />
    </div>
  )
}

export default Planet
