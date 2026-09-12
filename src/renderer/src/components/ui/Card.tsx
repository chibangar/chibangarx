import { cn } from "@/lib/utils"
import { playCardClick } from "@/lib/sound"

function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-chibangarx-card border border-chibangarx-border rounded-xl hover:border-chibangarx-primary transition group",
        className,
      )}
      {...props}
      onClick={(e) => {
        playCardClick()
        props.onClick?.(e)
      }}
    >
      {children}
    </div>
  )
}

export default Card
