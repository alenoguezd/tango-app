"use client"

import * as React from "react"

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-[#1A1A1A] text-white",
      secondary: "bg-[#F5F5F5] text-[#1A1A1A]",
      success: "bg-[#D4EDBA] text-[#2A5010]",
      warning: "bg-[#F5DC7A] text-[#5C4A00]",
      destructive: "bg-[#FEE2E2] text-[#991B1B]",
    }

    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center rounded-lg
          px-2 py-1 text-xs font-semibold
          ${variantClasses[variant]} ${className}
        `}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, type BadgeProps }
