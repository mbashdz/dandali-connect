"use client";

import Link from "next/link";
import { DandaliLogo } from "@/components/icons/dandali-logo";
import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { SearchInput } from "@/components/search-input";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Button } from "@/components/ui/button";
import { Globe, Wifi, WifiOff, MoreVertical, Search, Settings, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { language, toggleLanguage, dataSaver, toggleDataSaver } = useAppSettings();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-xs">
      <div className="container max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-2.5 sm:px-6 gap-2">
        {/* Left: Brand Logo & Desktop Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-5 shrink-0">
          <Link href="/" className="flex items-center">
            <DandaliLogo size="md" />
          </Link>
          <div className="hidden md:flex">
            <MainNav />
          </div>
        </div>

        {/* Center: Search (Visible on tablets and desktop) */}
        <div className="hidden sm:flex flex-1 items-center justify-center max-w-md px-1 sm:px-4">
          <SearchInput />
        </div>

        {/* Right Section: Controls & Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Mobile Search Icon Button */}
          <div className="sm:hidden">
            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Desktop Controls: Language & Data Saver & Dark Mode */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              title={language === "en" ? "Canja zuwa Hausa" : "Switch to English"}
              className="h-8 px-2 sm:px-2.5 rounded-xl border-border bg-card/50 text-[11px] sm:text-xs font-bold gap-1 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{language === "en" ? "Hausa" : "English"}</span>
            </Button>

            <Button
              variant={dataSaver ? "default" : "outline"}
              size="sm"
              onClick={toggleDataSaver}
              title={dataSaver ? "Data Saver Active" : "Enable Data Saver"}
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

            <DarkModeToggle />
          </div>

          {/* Mobile Quick Menu Dropdown (Consolidates items so mobile fits screen cleanly) */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border border-border">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                  Dandali Menu
                </DropdownMenuLabel>
                
                <DropdownMenuItem onClick={toggleLanguage} className="rounded-xl text-xs font-bold cursor-pointer gap-2.5">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{language === "en" ? "Yaren Hausa (HA)" : "English (EN)"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={toggleDataSaver} className="rounded-xl text-xs font-bold cursor-pointer gap-2.5">
                  {dataSaver ? <WifiOff className="w-4 h-4 text-secondary" /> : <Wifi className="w-4 h-4 text-muted-foreground" />}
                  <span>{dataSaver ? "Data-Saver: Kunne (On)" : "Data-Saver: Kashe (Off)"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold cursor-pointer gap-2.5">
                  <Link href="/terms">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Sharuddan Aiki (Terms)</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold cursor-pointer gap-2.5">
                  <Link href="/privacy">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Sirri da Tsaro (Privacy)</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Profile Navigation */}
          <UserNav />
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (Sticky bottom/tabs) */}
      <div className="md:hidden flex items-center justify-around border-t border-border/60 py-1 px-1 bg-background/95">
        <MainNav className="w-full justify-around space-x-0" />
      </div>
    </header>
  );
}
