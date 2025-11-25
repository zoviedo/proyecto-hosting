"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { ProjectCard } from "@/components/project-card"
import { toast } from "sonner"

interface BackendProject {
  _id: string
  id_usuario: string
  nombre_proyecto: string
  descripcion?: string
  template: string
  url_repositorio: string
  url_despliegue: string
  estado_real?: string
  username?: string
}

interface FrontendProject {
  id: string
  name: string
  description: string
  type: string
  status: "active" | "stopped"
  url: string
  estado_real?: string
}

interface UserData {
  userId: string
  username: string
}

interface CreateUsernameFormProps {
  onUsernameCreated: (username: string) => void
  currentUserId: string
}

const CreateUsernameForm: React.FC<CreateUsernameFormProps> = ({ onUsernameCreated, currentUserId }) => {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const AUTH_API_URL = "http://localhost:3000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      toast.error("Error de sesión. Vuelve a iniciar sesión.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/user-metadata/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username, userId: currentUserId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("¡Username registrado!", {
          description: `Tu dominio base será *.${username}.localhost`,
        })
        onUsernameCreated(username)
      } else {
        toast.error("Error al registrar username", {
          description: data.message || "Intenta con otro username.",
        })
      }
    } catch (err: any) {
      toast.error("Error de conexión", {
        description: "No se pudo contactar al servicio de autenticación.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative p-8 bg-card rounded-2xl border border-border shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg shadow-primary/30">
                  <svg
                    className="w-8 h-8 text-background"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ¡Paso Requerido!
                </h1>
                <p className="text-muted-foreground">Elige tu Username Único para los Dominios</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Username (Ej: mi-usuario-unico)
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Min 3 caracteres (minúsculas, números, guiones)"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    required
                    className="bg-background border-border focus:border-primary transition-colors"
                    minLength={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-[1.02] py-6 text-lg font-semibold shadow-lg shadow-primary/30"
                  disabled={loading || username.length < 3}
                >
                  {loading ? "Registrando Username..." : "Crear y Continuar"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Necesitas un username para acceder a tus proyectos en{" "}
                  <code className="font-mono text-primary">
                    nombreproyecto.{username || "tu-usuario"}.localhost
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<FrontendProject[]>([])
  const [loading, setLoading] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const API_URL = "http://localhost:3001"
  const AUTH_API_URL = "http://localhost:3000"

  const mapTemplateType = (backendType: string): string => {
    const type = backendType.toLowerCase().trim()
    if (type === "react") return "React"
    if (type === "flask") return "Flask"
    if (type === "html_css_js") return "HTML/CSS/JS"
    return "HTML/CSS/JS"
  }

  const checkUsername = async (token: string): Promise<UserData | null> => {
    try {
      const response = await fetch(`${AUTH_API_URL}/user-metadata/check`, {
        method: "GET",
        headers: { Authorization: token },
      })

      if (response.status === 404) {
        setNeedsUsername(true)
        return null
      }

      if (response.status === 401 || response.status === 403) {
        router.push("/login")
        return null
      }

      if (!response.ok) throw new Error("Fallo en auth")

      return (await response.json()) as UserData
    } catch (error) {
      console.error("Error checking username:", error)
      return null
    }
  }

  const fetchProjects = async (token: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "GET",
        headers: { Authorization: token },
      })

      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (response.ok) {
        const data: BackendProject[] = await response.json()

        const mappedProjects: FrontendProject[] = data.map((p) => ({
          id: p._id,
          name: p.nombre_proyecto,
          description: p.descripcion?.trim() || "",
          type: mapTemplateType(p.template),
          status: p.estado_real === "running" ? "active" : "stopped",
          url: `http://${p.nombre_proyecto}.${username}.localhost`,
          estado_real: p.estado_real?.toLowerCase() || "stopped",
        }))

        setProjects(mappedProjects)
      }
    } catch (error) {
      console.error("Error fetching projects", error)
    } finally {
      if (!needsUsername) setLoading(false)
    }
  }

  const handleUsernameCreated = (newUsername: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) return

    setUserData({ userId: userData?.userId || "", username: newUsername })
    setNeedsUsername(false)
    setLoading(true)

    fetchProjects(`Bearer ${token}`, newUsername)
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    const load = async () => {
      setLoading(true)

      const authHeader = `Bearer ${token}`

      const verifyRes = await fetch(`${AUTH_API_URL}/verify-token`, {
        headers: { Authorization: authHeader },
      })

      if (!verifyRes.ok) {
        router.push("/login")
        return
      }

      const user = await verifyRes.json()
      const currentUserId =
        user?.user?.id || user?.id || user?.userId || ""

      setUserData({ userId: currentUserId, username: "" })

      const metadata = await checkUsername(authHeader)

      if (metadata) {
        setUserData(metadata)
        await fetchProjects(authHeader, metadata.username)
        setNeedsUsername(false)
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken")

    if (token) {
      try {
        await fetch(`${AUTH_API_URL}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { }
    }

    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")

    router.push("/")
  }

  const handleDelete = async (id: string) => {
    const prev = [...projects]
    setProjects(projects.filter((p) => p.id !== id))

    try {
      const token = localStorage.getItem("accessToken")
      if (!token || !userData?.username)
        throw new Error()

      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error()

      fetchProjects(`Bearer ${token}`, userData.username)
    } catch (e) {
      console.error(e)
      setProjects(prev)

      toast.error("Error al eliminar")
    }
  }

  const handleToggleStatus = async (id: string) => {
    const token = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")

    if (!token || !refreshToken)
      return toast.error("No hay autenticación")

    const project = projects.find((p) => p.id === id)
    if (!project) return

    const action = project.estado_real === "running" ? "stop" : "start"

    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const res = await fetch(`${API_URL}/projects/${id}/${action}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!res.ok) {
          const err = await res.json()
          reject(new Error(err.message))
          return
        }

        const data = await res.json()
        if (data.newAccessToken)
          localStorage.setItem("accessToken", data.newAccessToken)

        await fetchProjects(
          `Bearer ${localStorage.getItem("accessToken")!}`,
          userData?.username!
        )

        if (action === "start") router.push(`/projects/${id}`)

        resolve()
      } catch (e) {
        reject(e)
      }
    })

    toast.promise(promise, {
      loading:
        action === "start"
          ? "Iniciando proyecto..."
          : "Deteniendo proyecto...",
      success:
        action === "start"
          ? "Proyecto iniciado correctamente"
          : "Proyecto detenido correctamente",
      error: (err) => err.message,
    })
  }

  if (loading && !needsUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">
            Cargando tus proyectos...
          </p>
        </div>
      </div>
    )
  }

  if (needsUsername && userData?.userId) {
    return (
      <CreateUsernameForm
        onUsernameCreated={handleUsernameCreated}
        currentUserId={userData.userId}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header showAuth onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Mis Proyectos
                </span>
              </h1>

              <p className="text-muted-foreground text-lg">
                Bienvenid@ {userData?.username}, administra y despliega tus proyectos
              </p>
            </div>

            <Link href="/projects/new">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-primary/30">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Crear proyecto
              </Button>
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Aquí podrás encontrar tus proyectos
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Crea tu primer proyecto y comienza a desplegar en segundos.
              <br />
              Conecta tu repositorio de GitHub y selecciona una plantilla.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                estado_real={project.estado_real}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
