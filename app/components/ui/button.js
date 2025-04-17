import { cn } from "../../lib/utils"

export function buttonVariants({ className, variant, size }) {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
      "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
      "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
      "bg-accent text-accent-foreground hover:bg-accent/80": variant === "accent",
      "bg-muted text-muted-foreground hover:bg-muted/80": variant === "muted",
      "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
      "bg-background text-foreground": variant === "link",
      "h-10 px-4 py-2": size === "default",
      "h-9 rounded-md px-3": size === "sm",
      "h-11 rounded-md px-8": size === "lg",
      "h-8 rounded-md px-2": size === "xs",
      "h-12 rounded-md px-10": size === "xl",
    },
    className
  )
}
