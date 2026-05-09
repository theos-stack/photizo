import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium tracking-[-0.02em] transition duration-300 ease-[var(--ease-crisp)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--gold)] text-[var(--black)] shadow-[0_14px_34px_rgba(255,214,0,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(255,214,0,0.26)]",
        secondary:
          "bg-[var(--dark-moss-green)] text-white shadow-[0_14px_34px_rgba(72,108,38,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(72,108,38,0.22)]",
        ghost:
          "border border-[rgba(11,11,11,0.08)] bg-white text-[var(--black)] hover:-translate-y-0.5 hover:border-[rgba(255,214,0,0.36)] hover:bg-[var(--cultured)]",
        outline:
          "border border-white/16 bg-white/8 text-white hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/12",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-10 px-4 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    href?: string;
  };

export function Button({
  className,
  variant,
  size,
  href,
  ...props
}: ButtonProps) {
  const classes = cn(buttonStyles({ variant, size, className }));

  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return <button className={classes} {...props} />;
}
