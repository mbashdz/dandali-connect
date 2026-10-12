"use client";

import Link from "next/link";
import { DandaliLogo } from "@/components/icons/dandali-logo";
import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { SearchInput } from "@/components/search-input";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Button } from "@/components/ui/button";
import { Globe, Wifi, WifiOff } from "lucide-react";

export function AppHeader() {
  const { language, toggleLanguage, dataSaver, toggleDataSaver } = useAppSettings();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-xs">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-5">
          <Link href="/" className="flex items-center">
            <DandaliLogo size="md" />
          </Link>
          <div className="hidden md:flex">
            <MainNav />
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 items-center justify-center max-w-md px-1 sm:px-4">
          <SearchInput />
        </div>

        {/* Right: African Utilities (Language switcher, Data-saver, Dark mode, User) */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Language Switcher Button (EN / HA) */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            title={language === "en" ? "Canja zuwa Hausa" : "Switch to English"}
            className="h-8 px-2.5 rounded-xl border-border bg-card/50 text-xs font-bold gap-1 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === "en" ? "Hausa" : "English"}</span>
          </Button>

          {/* Data-Saver Toggle Button */}
          <Button
            variant={dataSaver ? "default" : "outline"}
            size="sm"
            onClick={toggleDataSaver}
            title={dataSaver ? "Data Saver Active" : "Enable Data Saver for low bandwidth"}
            className={`h-8 px-2 rounded-xl text-xs font-semibold gap-1 transition-all ${
              dataSaver
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {dataSaver ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline text-[11px] font-bold">
              {dataSaver ? "Saver On" : "Data"}
            </span>
          </Button>

          {/* Theme Mode */}
          <DarkModeToggle />

          {/* User Profile Navigation */}
          <UserNav />
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-border/60 py-1.5 px-2 bg-background/95">
        <MainNav />
      </div>
    </header>
  );
}
