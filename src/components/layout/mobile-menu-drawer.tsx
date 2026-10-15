"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Home,
  Compass,
  Store,
  MessageSquare,
  Users,
  Settings,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  Globe,
  Wifi,
  WifiOff,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Bookmark,
  Bell,
  Search,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { doSignOut } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { DarkModeToggle } from "@/components/dark-mode-toggle";

export function MobileMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [showSettingsAccordion, setShowSettingsAccordion] = useState(false);
  const [showHelpAccordion, setShowHelpAccordion] = useState(false);
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { language, toggleLanguage, dataSaver, toggleDataSaver, t } = useAppSettings();
  const { toast } = useToast();

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(" ");
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0]?.[0] || "").toUpperCase() + (names[names.length - 1]?.[0] || "").toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await doSignOut();
      setOpen(false);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
    }
  };

  const shortcutGrid = [
    {
      title: language === "ha" ? "Babban Shafi" : "Feed (Home)",
      desc: language === "ha" ? "Sakonni da labarai" : "Latest updates",
      href: "/",
      icon: Home,
      color: "text-primary bg-primary/10",
    },
    {
      title: language === "ha" ? "Binciko" : "Explore",
      desc: language === "ha" ? "Abubuwan da ke yawo" : "Trends & topics",
      href: "/explore",
      icon: Compass,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: language === "ha" ? "Kasuwa" : "Marketplace",
      desc: language === "ha" ? "Sayarwa da saye" : "Buy & sell items",
      href: "/kasuwa",
      icon: Store,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: language === "ha" ? "Sakonni" : "Messages",
      desc: language === "ha" ? "Tattaunawa ta sirri" : "Direct chats",
      href: "/messages",
      icon: MessageSquare,
      color: "text-green-500 bg-green-500/10",
    },
    {
      title: language === "ha" ? "Bincike" : "Search",
      desc: language === "ha" ? "Nemo abokai & posts" : "Find friends & posts",
      href: "/search",
      icon: Search,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: language === "ha" ? "Saituna" : "Settings",
      desc: language === "ha" ? "Bayanai & sirri" : "Account & privacy",
      href: "/settings",
      icon: Settings,
      color: "text-rose-500 bg-rose-500/10",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-foreground hover:bg-muted relative"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border/80 overflow-y-auto"
      >
        <SheetHeader className="p-4 pb-3 border-b border-border/70 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background/95 backdrop-blur-md z-20">
          <SheetTitle className="text-base font-black flex items-center gap-2">
            <span>Menu</span>
          </SheetTitle>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="rounded-full h-8 px-3 border-border/80 bg-muted/60 hover:bg-muted text-xs font-bold gap-1"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === "ha" ? "Rufe" : "Close"}</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-5 flex-1">
          {/* User Profile Card Header (Facebook style) */}
          {currentUser ? (
            <Link
              href={`/${currentUser.username || ""}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/70 hover:border-primary/40 shadow-xs transition-all active:scale-[0.98]"
            >
              <Avatar className="h-12 w-12 border border-primary/20 shadow-xs">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(currentUser.name || currentUser.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {currentUser.name || currentUser.username}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  @{currentUser.username || "user"}
                </p>
                <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 mt-0.5">
                  <UserIcon className="w-3 h-3" />
                  {language === "ha" ? "Duba bayananka (View Profile)" : "View your profile"}
                </span>
              </div>
            </Link>
          ) : (
            <div className="p-4 rounded-2xl bg-card border border-border/70 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                {language === "ha"
                  ? "Shiga domin more duk ayyukan Zaure Connect"
                  : "Sign in to unlock all Zaure Connect features"}
              </p>
              <Button asChild size="sm" className="w-full rounded-xl font-bold bg-primary text-primary-foreground">
                <Link href="/login" onClick={() => setOpen(false)}>
                  {language === "ha" ? "Shiga Zaure Connect (Log In)" : "Log In"}
                </Link>
              </Button>
            </div>
          )}

          {/* Quick Shortcuts (Facebook 2x3 Grid Style) */}
          <div>
            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              {language === "ha" ? "Gajerun Hanyoyi (Shortcuts)" : "Your Shortcuts"}
            </h5>
            <div className="grid grid-cols-2 gap-2.5">
              {shortcutGrid.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex flex-col p-3 rounded-2xl border transition-all active:scale-[0.97] ${
                      isActive
                        ? "bg-primary/10 border-primary/40 shadow-xs"
                        : "bg-card border-border/60 hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {item.desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Collapsible Sub-Menus: Settings & Privacy (Facebook style) */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowSettingsAccordion(!showSettingsAccordion)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/70 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {language === "ha" ? "Saituna & Sirri" : "Settings & Privacy"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "ha" ? "Yare, data, da tsaro" : "Language, data saver, security"}
                  </p>
                </div>
              </div>
              {showSettingsAccordion ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showSettingsAccordion && (
              <div className="pl-11 pr-2 py-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/60 text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>{language === "ha" ? "Yare: Hausa" : "Language: English"}</span>
                  </span>
                  <span className="text-[11px] font-bold text-primary underline">
                    {language === "ha" ? "Switch to EN" : "Canja zuwa HA"}
                  </span>
                </button>

                {/* Data Saver Switch */}
                <button
                  type="button"
                  onClick={toggleDataSaver}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/60 text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    {dataSaver ? (
                      <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>Data Saver</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      dataSaver ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dataSaver ? "Active (Kunne)" : "Off (Kashe)"}
                  </span>
                </button>

                {/* Account Settings Link */}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/60 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{language === "ha" ? "Dukkan Saituna" : "All Account Settings"}</span>
                  </span>
                </Link>
              </div>
            )}

            {/* Collapsible Sub-Menus: Help & Support */}
            <button
              type="button"
              onClick={() => setShowHelpAccordion(!showHelpAccordion)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/70 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {language === "ha" ? "Taimako & Sharudda" : "Help & Policies"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "ha" ? "Sharuɗɗan aiki da sirri" : "Terms, privacy, and safety"}
                  </p>
                </div>
              </div>
              {showHelpAccordion ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showHelpAccordion && (
              <div className="pl-11 pr-2 py-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <Link
                  href="/terms"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/60 text-xs font-semibold text-foreground"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{language === "ha" ? "Sharuddan Aiki (Terms)" : "Terms of Service"}</span>
                </Link>
                <Link
                  href="/privacy"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/60 text-xs font-semibold text-foreground"
                >
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{language === "ha" ? "Dokokin Sirri (Privacy)" : "Privacy Policy"}</span>
                </Link>
              </div>
            )}
          </div>

          <Separator className="opacity-60" />

          {/* Logout Action (if logged in) */}
          {currentUser && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full rounded-2xl h-11 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === "ha" ? "Fita Daga Zaure (Log Out)" : "Log Out"}</span>
            </Button>
          )}

          <div className="text-center pt-2 pb-4">
            <p className="text-[11px] text-muted-foreground font-semibold">
              Zaure Connect Africa • v1.0.0
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
