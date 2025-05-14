import Link from "next/link"
import DandaliLogo from "@/components/icons/dandali-logo"
import { MainNav } from "@/components/layout/main-nav"
import { UserNav } from "@/components/layout/user-nav"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { SearchInput } from "@/components/search-input"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <DandaliLogo />
          </Link>
          <div className="hidden md:flex">
             <MainNav />
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-center px-4 md:px-8">
          <SearchInput />
        </div>

        <div className="flex items-center space-x-2">
          <DarkModeToggle />
          <UserNav />
        </div>
      </div>
      <div className="md:hidden flex items-center justify-center border-t py-2 bg-background">
         <MainNav />
      </div>
    </header>
  )
}
