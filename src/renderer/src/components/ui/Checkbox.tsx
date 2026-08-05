import { useId } from "react"
import { Check } from "lucide-react"
import { playCheckbox } from "@/lib/sound"

interface CheckboxProps {
  label?: string
  checked: boolean
  onChange?: (checked: boolean) => void
  onClick?: () => void
}

export default function Checkbox({
  label,
  checked,
  onChange,
  onClick,
}: CheckboxProps): React.ReactElement {
  const id = useId()

  return (
    <label
      htmlFor={id}
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer select-none text-slate-200"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          playCheckbox()
          onChange?.(e.target.checked)
        }}
        className="peer hidden"
        aria-checked={checked}
      />
      <div className="h-5 w-5 rounded-md border-2 border-chibangarx-border flex items-center justify-center transition-colors peer-checked:bg-chibangarx-primary peer-checked:border-chibangarx-border">
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </div>
      <span className="text-sm">{label}</span>
    </label>
  )
}
