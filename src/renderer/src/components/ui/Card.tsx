import { cn } from "@/lib/utils"

function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-chibangarx-card border border-chibangarx-border rounded-xl hover:border-chibangarx-primary transition group",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
