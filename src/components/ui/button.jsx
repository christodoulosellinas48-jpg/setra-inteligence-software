import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 relative",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#8B4BFF] via-[#7B3BFF] to-[#9D4EFF] text-white shadow-lg shadow-[#7B3BFF]/40 hover:shadow-2xl hover:shadow-[#7B3BFF]/60 hover:scale-110 hover:-translate-y-0.5 font-semibold tracking-wide",
        destructive:
          "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40 hover:shadow-2xl hover:shadow-red-500/60 hover:scale-110 hover:-translate-y-0.5 font-semibold",
        outline:
          "border-2 border-[#7B3BFF]/60 bg-[#0D0D1A]/60 backdrop-blur-sm hover:bg-[#7B3BFF]/10 hover:border-[#A855F7]/80 hover:shadow-lg hover:shadow-[#7B3BFF]/30 font-semibold",
        secondary:
          "bg-gradient-to-br from-[#2A2A3A] to-[#1F1F30] text-white shadow-md shadow-black/40 hover:from-[#3A3A4A] hover:to-[#2F2F40] hover:shadow-lg hover:shadow-[#7B3BFF]/20 hover:scale-105",
        ghost: "text-white hover:bg-[#7B3BFF]/15 hover:text-[#A855F7] hover:shadow-lg hover:shadow-[#7B3BFF]/20 font-medium",
        link: "text-[#A855F7] underline-offset-4 hover:underline hover:text-[#C084FC] font-semibold",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }