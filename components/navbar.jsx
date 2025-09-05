"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User, LogOut, PenTool, Home, Shield, Crown, Menu, Compass } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <nav className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Shayari Hub
          </Link>
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </div>
      </nav>
    )
  }

  const isAdmin = user && (user.role === "admin" || user.role === "super_admin")
  const isSuperAdmin = user && user.role === "super_admin"

  const NavLinks = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      <Link href="/explore" onClick={onItemClick}>
        <Button variant="ghost" size="sm" className={mobile ? "w-full justify-start" : ""}>
          <Compass className="w-4 h-4 mr-2" />
          Explore
        </Button>
      </Link>
      {user && (
        <>
          <Link href="/dashboard" onClick={onItemClick}>
            <Button variant="ghost" size="sm" className={mobile ? "w-full justify-start" : ""}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/create" onClick={onItemClick}>
            <Button variant="ghost" size="sm" className={mobile ? "w-full justify-start" : ""}>
              <PenTool className="w-4 h-4 mr-2" />
              Write
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={onItemClick}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 ${mobile ? "w-full justify-start" : ""}`}
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </>
      )}
    </>
  )

  return (
    <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Shayari Hub
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <NavLinks />
          <ThemeToggle />
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <Avatar className="h-10 w-10 ring-2 ring-purple-100 dark:ring-purple-800">
                        <AvatarImage src={user.profilePhoto || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <NavLinks mobile onItemClick={() => setMobileOpen(false)} />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 ring-2 ring-purple-100 dark:ring-purple-800">
                    <AvatarImage src={user.profilePhoto || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    {user.role !== "user" && (
                      <div className="flex items-center gap-1 text-xs">
                        {isSuperAdmin ? (
                          <>
                            <Crown className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Super Admin</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">Admin</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/create" className="cursor-pointer">
                    <PenTool className="mr-2 h-4 w-4" />
                    Write Shayari
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer text-orange-600 dark:text-orange-400">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    {isSuperAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/super" className="cursor-pointer text-yellow-600 dark:text-yellow-400">
                          <Crown className="mr-2 h-4 w-4" />
                          Super Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            <div className="space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                >
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
