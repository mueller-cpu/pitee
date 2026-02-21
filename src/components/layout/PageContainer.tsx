import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className,
}: PageContainerProps) {
  return (
    <main className={cn("px-4 py-6 pb-24 max-w-lg mx-auto", className)}>
      {children}
    </main>
  );
}
