import React from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailLayoutProps {
  children: React.ReactNode;
  title?: string;
  backTo?: string;
}

export function DetailLayout({ children, title, backTo = "/" }: DetailLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-background shadow-2xl flex flex-col sm:border-x border-border">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-4 flex items-center h-16">
        <Button asChild variant="ghost" size="icon" className="shrink-0 -ml-2 rounded-full">
          <Link href={backTo}>
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </Button>
        {title && (
          <h1 className="text-lg font-semibold flex-1 text-center truncate pr-8">
            {title}
          </h1>
        )}
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
