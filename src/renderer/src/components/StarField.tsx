import { useEffect, useState, useMemo } from "react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  animationDelay: number
  animationDuration: number
  color: string
  type: "tiny" | "normal" | "bright"
}

interface ShootingStar {
  id: number
  startX: number
  startY: number
  angle: number
  length: number
  speed: number
  delay: number
  size: number
}

const STAR_COLORS = [
  "rgba(255, 255, 255, 1)",
  "rgba(200, 220, 255, 1)",
  "rgba(180, 200, 255, 1)",
  "rgba(255, 230, 200, 1)",
  "rgba(255, 210, 180, 1)",
  "rgba(160, 180, 255, 1)",
]

function StarField() {
  const [stars, setStars] = useState<Star[]>([])
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])

  useEffect(() => {
    const newStars: Star[] = []
    for (let i = 0; i < 200; i++) {
      const rand = Math.random()
      let type: "tiny" | "normal" | "bright"
      let size: number
      if (rand < 0.5) {
        type = "tiny"
        size = Math.random() * 1 + 0.3
      } else if (rand < 0.88) {
        type = "normal"
        size = Math.random() * 1.5 + 1
      } else {
        type = "bright"
        size = Math.random() * 2 + 2
      }

      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        opacity: type === "bright" ? Math.random() * 0.3 + 0.7 : Math.random() * 0.6 + 0.2,
        animationDelay: Math.random() * 8,
        animationDuration: type === "bright" ? Math.random() * 2 + 3 : Math.random() * 4 + 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        type,
      })
    }
    setStars(newStars)
  }, [])

  useEffect(() => {
    const createShootingStar = () => {
      const newStar: ShootingStar = {
        id: Date.now() + Math.random(),
        startX: Math.random() * 80 + 10,
        startY: Math.random() * 40,
        angle: Math.random() * 20 + 25,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 0.8 + 0.6,
        delay: Math.random() * 0.3,
        size: Math.random() * 1.5 + 1,
      }
      setShootingStars((prev) => [...prev.slice(-3), newStar])

      setTimeout(() => {
        setShootingStars((prev) => prev.filter((s) => s.id !== newStar.id))
      }, 2000)
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.4) createShootingStar()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const nebulaStyle = useMemo(
    () => ({
      background: [
        "radial-gradient(ellipse at 15% 50%, rgba(108, 156, 255, 0.07) 0%, transparent 50%)",
        "radial-gradient(ellipse at 85% 15%, rgba(168, 123, 255, 0.06) 0%, transparent 45%)",
        "radial-gradient(ellipse at 50% 85%, rgba(108, 156, 255, 0.04) 0%, transparent 50%)",
        "radial-gradient(ellipse at 60% 40%, rgba(80, 60, 180, 0.03) 0%, transparent 40%)",
      ].join(", "),
    }),
    [],
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.opacity,
            boxShadow:
              star.type === "bright"
                ? `0 0 ${star.size * 3}px ${star.color}, 0 0 ${star.size * 6}px ${star.color.replace(", 1)", ", 0.3)")}`
                : star.type === "normal"
                  ? `0 0 ${star.size}px ${star.color.replace(", 1)", ", 0.5)")}`
                  : "none",
            animation: `twinkle ${star.animationDuration}s ease-in-out ${star.animationDelay}s infinite`,
          }}
        />
      ))}

      {shootingStars.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.startX}%`,
            top: `${s.startY}%`,
            width: `${s.length}px`,
            height: `${s.size}px`,
            background: `linear-gradient(${s.angle}deg, rgba(255,255,255,0.9) 0%, rgba(160,180,255,0.6) 30%, transparent 100%)`,
            borderRadius: "50%",
            animation: `shootingStar ${s.speed}s ease-out ${s.delay}s forwards`,
            filter: `blur(0.5px)`,
          }}
        />
      ))}

      <div className="absolute inset-0" style={nebulaStyle} />
    </div>
  )
}

export default StarField
