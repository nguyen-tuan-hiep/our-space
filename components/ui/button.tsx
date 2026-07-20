import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "interactive-lift group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-accentLight text-onAccentLight dark:bg-accentDark dark:text-onAccentDark shadow-[0_10px_24px_rgba(23,23,23,0.18)] hover:bg-accentHoverLight dark:hover:bg-accentHoverDark",
        outline:
          "border-neutral-900/15 bg-secondaryLight text-neutral-900 shadow-[0_4px_14px_rgba(23,23,23,0.06)] hover:border-neutral-900/25 hover:bg-hoverLight hover:text-neutral-950 aria-expanded:bg-hoverLight aria-expanded:text-neutral-950 dark:border-accentDark/20 dark:bg-hoverDark/55 dark:text-white dark:hover:border-accentDark/40 dark:hover:bg-accentContainerDark dark:hover:text-onAccentContainerDark dark:aria-expanded:bg-hoverDark dark:aria-expanded:text-white",
        secondary:
          "border-neutral-900/10 bg-accentContainerLight text-onAccentContainerLight hover:bg-secondaryLight aria-expanded:bg-secondaryLight aria-expanded:text-neutral-950 dark:border-accentDark/16 dark:bg-accentContainerDark dark:text-onAccentContainerDark dark:hover:bg-hoverDark dark:hover:text-white dark:aria-expanded:bg-hoverDark dark:aria-expanded:text-white",
        ghost:
          "bg-secondaryLight text-neutral-700 hover:bg-accentLight/20 hover:text-neutral-950 aria-expanded:bg-hoverLight aria-expanded:text-neutral-950 dark:bg-secondaryDark dark:text-neutral-900 dark:hover:bg-hoverDark dark:hover:text-white dark:aria-expanded:bg-hoverDark dark:aria-expanded:text-white",
        destructive:
          "border-transparent bg-transparent text-danger hover:bg-danger-bg hover:text-danger focus-visible:border-danger/40 focus-visible:ring-danger/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
