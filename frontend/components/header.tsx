"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface HeaderProps {
  showAuth?: boolean
  onLogout?: () => void
}

export function Header({ showAuth = false, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleDashboardClick = () => {
    if (pathname === "/home") {
      router.refresh()
    } else {
      router.push("/home")
    }
  }

  return (
    <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={showAuth ? "/home" : "/"} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 text-background" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            HostingWeb
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!showAuth ? (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleDashboardClick}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Cerrar sesión
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-64 space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">¿Cerrar sesión?</h4>
                  <p className="text-sm text-muted-foreground">
                    ¿Seguro que deseas salir de tu cuenta?
                  </p>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-muted"
                    >
                      Cancelar
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onLogout}
                      className="hover:opacity-90"
                    >
                      Salir
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
