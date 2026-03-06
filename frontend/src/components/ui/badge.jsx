import * as React from "react";

import { cn } from "../../lib/utils";

const badgeVariants = {
  default:
    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
};

function Badge({ className, variant = "default", ...props }) {
  return <div className={cn(badgeVariants[variant], className)} {...props} />;
}

export { Badge };
