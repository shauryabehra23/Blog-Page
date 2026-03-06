import * as React from "react";

import { cn } from "../../lib/utils";

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger = React.forwardRef(
  ({ className, asChild, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn("cursor-pointer", className)} {...props}>
        {children}
      </button>
    );
  },
);

const DropdownMenuContent = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuLabel = ({ className, children, ...props }) => {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className, ...props }) => {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
