import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className="h-10 w-full rounded px-3 py-2 text-base border"
        style={{ 
          color: '#000000',
          backgroundColor: '#e5e7eb',
          borderColor: '#9ca3af',
          fontSize: '16px'
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
