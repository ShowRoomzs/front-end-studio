import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        /*
          디자인시스템 `.btn-primary` / `.btn-secondary` / `.btn-danger-solid`.
          shadcn 기본 토큰(--accent/--border/--destructive)은 --sz-*와 별개
          (회색 oklch·다른 빨강)라 실제 색이 어긋난다. 제네릭 토큰으로 되돌리지 말 것.
        */
        default: "bg-sz-accent-500 text-white hover:bg-sz-accent-600",
        destructive: "bg-sz-danger-text text-white hover:bg-[#8f2828]",
        outline:
          "border border-sz-n-300 bg-white text-sz-n-900 shadow-xs hover:bg-sz-n-100",
        ghost: "hover:bg-sz-n-100 hover:text-sz-n-900",
        link: "text-sz-accent-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" />}
      {props.children}
    </Comp>
  )
}

export { Button }
