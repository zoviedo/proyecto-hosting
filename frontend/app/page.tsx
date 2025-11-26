"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 animate-pulse">
              🚀 Deploy in seconds
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent text-balance">
              Host your projects instantly
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            La plataforma más rápida para desplegar tus proyectos web en contenedores Docker. Sube tu código, selecciona
            tu plantilla y despliega en segundos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-105 text-lg px-8 py-6 shadow-lg shadow-primary/30"
              >
                Get Started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <a
              href="https://youtu.be/-I136afZ_2Y"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 hover:bg-primary/10 text-lg px-8 py-6 bg-transparent"
              >
                View Demo
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              ¿Cómo funciona?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">Tres simples pasos para desplegar tu proyecto</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                <span className="text-3xl font-bold text-background">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-primary">Crear cuenta</h3>
              <p className="text-muted-foreground leading-relaxed">
                Regístrate en segundos con tu email o inicia sesión para iniciar un proyecto.
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-accent opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mb-6 shadow-lg shadow-secondary/30">
                <span className="text-3xl font-bold text-background">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-secondary">Subir proyecto</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conecta tu repositorio de GitHub y selecciona la plantilla que mejor se adapte a tu proyecto.
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-6 shadow-lg shadow-accent/30">
                <span className="text-3xl font-bold text-background">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-accent">¡Desplegar!</h3>
              <p className="text-muted-foreground leading-relaxed">
                Un clic y tu proyecto estará en línea en un contenedor Docker optimizado y listo para producción.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Deploy ultrarrápido</h3>
              <p className="text-muted-foreground">
                Contenedores optimizados que se despliegan en menos de 30 segundos
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary">Seguro y confiable</h3>
              <p className="text-muted-foreground">Aislamiento completo con Docker y monitoreo 24/7</p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-accent">Métricas en tiempo real</h3>
              <p className="text-muted-foreground">Visualiza CPU, RAM y uptime de tus contenedores</p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Múltiples templates</h3>
              <p className="text-muted-foreground">HTML/CSS/JS, React, Flask y más frameworks listos para usar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 HostingWeb. Despliega con confianza. 🚀</p>
        </div>
      </footer>
    </div>
  )
}
