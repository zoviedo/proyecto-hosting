"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"


interface BackendProject {
  _id: string
  nombre_proyecto: string
  description?: string
  template: string
  url_repositorio: string
  url_despliegue: string
  estado_real?: string
  ultimo_acceso?: string;
}

const RAM_LIMIT_MB = 512;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [project, setProject] = useState<BackendProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [metrics, setMetrics] = useState({ cpu: "0", ram: "0" })

  const API_URL = "http://localhost:3001"

  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${API_URL}/projects/${resolvedParams.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        alert("Proyecto no encontrado")
        router.push("/home")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  useEffect(() => {
    fetchProjectDetails()

    const interval = setInterval(async () => {
      const token = localStorage.getItem("accessToken")
      if (!token) return

      try {
        const res = await fetch(`${API_URL}/projects/${resolvedParams.id}/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            cpu: data.cpu || "0",
            ram: data.ram || "0 MB"
          });
          fetchProjectDetails();
        }
      } catch (e) { console.error("Error métricas", e) }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchProjectDetails, resolvedParams.id])

  const handleToggleStatus = async () => {
    if (!project) return;

    setActionLoading(true);

    const action = project.estado_real === 'running' ? 'stop' : 'start';
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      setActionLoading(false);
      return toast.error("Sesión incompleta.", { description: "Por favor, reingrese para continuar la acción." });
    }

    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await fetch(`${API_URL}/projects/${project._id}/${action}`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            reject(new Error("Contenedor no encontrado. Por favor, usa la opción 'Re-desplegar'."));
            return;
          }
          const err = await res.json();
          reject(new Error(err.message || "Error al cambiar estado."));
          return;
        }

        const data = await res.json();
        if (data.newAccessToken) {
          localStorage.setItem("accessToken", data.newAccessToken);
        }
        await fetchProjectDetails();
        resolve();

      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: action === "start" ? "Iniciando proyecto..." : "Deteniendo proyecto...",
      success: action === "start" ? "Proyecto iniciado correctamente" : "Proyecto detenido correctamente",
      error: (err) => err.message || "Fallo la acción de Docker.",
      id: `toggle-status-${project._id}`
    });

    promise.finally(() => setActionLoading(false));
  };

  const [redeployOpen, setRedeployOpen] = useState(false)

  const handleRedeploy = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const refreshToken = localStorage.getItem("refreshToken")

      const res = await fetch(`${API_URL}/projects/${resolvedParams.id}/redeploy`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fallo redeploy");
      }

      toast.success("Proyecto re-desplegado", {
        description: "El contenedor fue reconstruido correctamente.",
      })

      await fetchProjectDetails()

    } catch (error: any) {
      toast.error("Error al re-desplegar", {
        description: error.message,
      })
    } finally {
      setActionLoading(false)
      setRedeployOpen(false)
    }
  }

  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/projects/${resolvedParams.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fallo al eliminar en servidor.")
      }

      toast.success("Proyecto eliminado", {
        description: "El proyecto fue eliminado permanentemente.",
      })

      router.push("/home")

    } catch (error: any) {
      toast.error("Error al eliminar", {
        description: error.message,
      })
    } finally {
      setActionLoading(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    )
  }
  if (!project) return null

  const lastAccessString = project.ultimo_acceso;

  const lastAccessDate = lastAccessString ? new Date(lastAccessString) : null;

  const isActive = project.estado_real === 'running';
  const isNotFound = project.estado_real === 'not_found';

  const cpuVal = parseFloat(metrics.cpu);
  const ramUsedMB = parseFloat(metrics.ram.split(' ')[0] || "0");
  const ramPercent = (ramUsedMB / RAM_LIMIT_MB) * 100;

  const templateMap: Record<string, string> = {
    html_css_js: "HTML/CSS/JS",
    flask: "Flask",
    react: "React",
  };

  const readableTemplate = templateMap[project.template] ?? project.template;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header showAuth onLogout={() => router.push("/")} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/home")}
            className="mb-6 hover:bg-primary/10 hover:text-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Button>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-lg mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {project.nombre_proyecto}
                </h1>

                <p className="text-muted-foreground text-lg">
                  {project.description}
                </p>

                <div className="flex gap-2 items-center text-muted-foreground mt-2">
                  <span className="text-sm bg-muted px-2 py-1 rounded font-mono">{project._id}</span>
                  {isNotFound && <span className="text-xs text-muted-foreground font-bold">Este contenedor no existe o fue eliminado. Vuelve a desplegar para continuar.</span>}
                </div>
              </div>

              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : (isNotFound ? "bg-chart-5/20 text-chart-5 border border-chart-5/30" : "bg-muted text-muted-foreground border border-border")
                  }`}
              >

                {isActive ? "● Activo" : (isNotFound ? "⏸︎ Inactivo" : "○ Detenido")}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-semibold text-foreground">{readableTemplate}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a href={project.url_despliegue} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary hover:underline">
                  {project.url_despliegue}
                </a>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <a href={project.url_repositorio} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                  URL del repositorio de GitHub
                </a>
              </div>
              <div className="w-full flex items-center gap-2 text-muted-foreground mt-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                <span className="font-medium">Última actividad:</span>

                {lastAccessDate ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {lastAccessDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                    </span>
                    <span className="text-muted-foreground">
                      {lastAccessDate.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-foreground">N/A</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Métricas */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-primary">Métricas del contenedor</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground font-medium">Uso de CPU</span>
                    <span className="text-2xl font-bold text-primary">{metrics.cpu}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                      style={{ width: `${Math.min(cpuVal, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground font-medium">Memoria RAM</span>
                    <span className="text-2xl font-bold text-secondary">{metrics.ram}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                      style={{ width: `${Math.min(ramPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="text-xl font-bold text-accent">{isActive ? "En línea" : "Inactivo"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-secondary">Acciones</h2>

              <div className="space-y-4">
                <Button
                  onClick={handleToggleStatus}
                  disabled={actionLoading || isNotFound}
                  className={`w-full py-6 text-lg font-semibold transition-all transform hover:scale-[1.02] ${isActive
                    ? "bg-gradient-to-r from-accent to-accent/70 hover:opacity-90 shadow-lg shadow-accent/30"
                    : "bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/30"
                    }`}
                >
                  {actionLoading ? "Procesando..." : (isActive ? "Detener proyecto" : "Iniciar proyecto")}
                </Button>

                <Link href={`/projects/${resolvedParams.id}/edit`} className="block">
                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    className="w-full py-6 text-lg hover:bg-secondary/10 hover:text-secondary hover:border-secondary/50 transition-all transform hover:scale-[1.02] bg-transparent"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar configuración
                  </Button>
                </Link>

                <AlertDialog open={redeployOpen} onOpenChange={setRedeployOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full py-6 text-lg hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      Re-desplegar
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Re-desplegar proyecto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto detendrá el contenedor, traerá los últimos cambios desde GitHub
                        y reconstruirá la imagen. Puede tardar unos minutos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRedeploy}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>


                <div className="pt-4 border-t border-border">
                  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full py-6 text-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
                      >
                        Eliminar proyecto
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción es permanente y eliminará el proyecto, el contenedor y sus recursos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}