"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Store, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppSettings } from "@/contexts/app-settings-context"

import { MobileMenuDrawer } from "@/components/layout/mobile-menu-drawer"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { t, language } = useAppSettings();

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/explore", label: t("explore"), icon: Compass },
    { href: "/kasuwa", label: t("kasuwa"), icon: Store, badge: "New" },
    { href: "/messages", label: language === "ha" ? "Sakonni" : "Messages", icon: MessageSquare },
  ];

  return (
    <nav
      className={cn("flex items-center space-x-1 sm:space-x-2 lg:space-x-3", className)}
      {...props}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            asChild
            className={cn(
              "text-xs sm:text-sm font-bold transition-all rounded-xl relative py-1 px-2.5 sm:px-3",
              isActive 
                ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <Link href={item.href} className="flex items-center gap-1.5 sm:gap-2">
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="hidden sm:inline-block text-[10px] bg-primary text-primary-foreground font-black px-1.5 py-0.2 rounded-full uppercase leading-tight">
                  {item.badge}
                </span>
              )}
            </Link>
          </Button>
        );
      })}

      {/* Mobile-only Menu tab (Facebook style: Home, Watch/Explore, Marketplace, Messages, Menu) */}
      <div className="md:hidden">
        <MobileMenuDrawer />
      </div>
    </nav>
  );
}
