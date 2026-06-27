import React from "react";
import { Link, useLocation } from "wouter";
import { Search, CalendarDays, Rss, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { name: "Search", href: "/search", icon: Search },
    { name: "Classes", href: "/classes", icon: CalendarDays },
    { name: "Feed", href: "/feed", icon: Rss },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="mx-auto w-full max-w-[430px] h-[100dvh] bg-background shadow-2xl relative flex flex-col sm:border-x border-border">
      <main className="flex-1 overflow-y-auto scrollbar-none" style={{ paddingBottom: "4.5rem" }}>
        {children}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-md px-6 py-2 pb-safe z-50">
        <ul className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-6 h-6 mb-1 transition-transform", isActive && "scale-110")} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
