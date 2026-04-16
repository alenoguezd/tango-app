"use client"

import * as React from "react"

type ButtonVariant = "default" | "outline" | "ghost" | "secondary"
type ButtonSize = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-[#1A1A1A] text-white hover:opacity-90",
      outline: "border border-[#EEEBE6] bg-transparent text-[#1A1A1A] hover:bg-[#F5F5F5]",
      ghost: "bg-transparent text-[#1A1A1A] hover:bg-[#F5F5F5]",
      secondary: "bg-[#A8C87A] text-[#1A1A1A] hover:opacity-90",
    }

    const sizeClasses = {
      default: "px-4 py-2 text-sm font-medium",
      sm: "px-3 py-1.5 text-xs font-medium",
      lg: "px-6 py-3 text-base font-medium",
      icon: "h-9 w-9 p-0",
    }

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          rounded-lg transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}
        `}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, type ButtonProps }
