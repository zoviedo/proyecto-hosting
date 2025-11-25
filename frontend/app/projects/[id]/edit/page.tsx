"use client"

import type React from "react"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { toast } from "sonner";

interface BackendProject {
  _id: string
  nombre_proyecto: string
  description?: string
  template: string
  url_repositorio: string
  url_despliegue: string
}

interface FormData {
  id: string
  name: string
  description: string
  repoUrl: string
  integrateRoble: boolean
  robleProjectCode: string
  robleCredentials: string
}

const initialFormData: FormData = {
  id: "",
  name: "",
  description: "",
  repoUrl: "",
  integrateRoble: false,
  robleProjectCode: "",
  robleCredentials: "",
}

const API_URL = "http://localhost:3001"

const mapTemplateType = (backendType: string) => {
  const type = backendType?.toLowerCase().trim();
  if (type === "react") return "Aplicación con React";
  if (type === "flask") return "Flask (Python)";
  if (type === "html_css_js") return "HTML/CSS/JS";
  return backendType || 'N/A';
};

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const hasChanges = originalData && JSON.stringify(originalData) !== JSON.stringify(formData);
  const repoChanged = originalData && originalData.repoUrl !== formData.repoUrl;


  const [projectInfo, setProjectInfo] = useState<{ id: string, template: string } | null>(null);



  const fetchProjectDetails = useCallback(async () => {
    const projectId = resolvedParams.id
    if (!projectId || projectId === "undefined") {
      setLoading(false)
      setError("Error: El ID del proyecto no se pudo resolver. Vuelve al detalle e inténtalo de nuevo.")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || "Error al cargar los detalles.")
      }

      const data: BackendProject = await response.json()

      setProjectInfo({ id: data._id, template: data.template });

      setFormData({
        id: data._id,
        name: data.nombre_proyecto,
        description: data.description || "",
        repoUrl: data.url_repositorio,
        integrateRoble: false,
        robleProjectCode: "",
        robleCredentials: "",
      })
      setOriginalData({
        id: data._id,
        name: data.nombre_proyecto,
        description: data.description || "",
        repoUrl: data.url_repositorio,
        integrateRoble: false,
        robleProjectCode: "",
        robleCredentials: "",
      });

    } catch (error: any) {
      console.error("Error fetching project for edit:", error)
      setError(
        "Fallo al cargar la configuración del proyecto: " + (error.message || "Error desconocido.")
      )
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  useEffect(() => {
    fetchProjectDetails()
  }, [fetchProjectDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken || !refreshToken) {
      toast.error("Error de autenticación", {
        description: "Tu sesión expiró. Inicia sesión nuevamente."
      });
      setLoading(false);
      router.push("/login");
      return;
    }

    const repoChanged = originalData?.repoUrl !== formData.repoUrl;

    const updatePayload = {
      nombre_proyecto: formData.name,
      descripcion: formData.description,
      url_repositorio: formData.repoUrl,
      refreshToken: refreshToken
    };

    try {
      toast.loading("Guardando cambios...", {
        id: "save-project"
      });

      const response = await fetch(`${API_URL}/projects/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar el proyecto.");
      }

      if (data.newAccessToken) {
        localStorage.setItem("accessToken", data.newAccessToken);
      }

      if (repoChanged) {
        toast.loading("Repositorio cambiado. Re-desplegando proyecto...", {
          id: "redeploy"
        });

        const redeployRes = await fetch(
          `${API_URL}/projects/${formData.id}/redeploy`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify({ refreshToken })
          }
        );

        const redeployData = await redeployRes.json();

        if (!redeployRes.ok) {
          throw new Error(redeployData.message || "Error en el re-despliegue.");
        }

        toast.success("Proyecto re-desplegado correctamente 🎉", {
          id: "redeploy",
          description: "Tu proyecto fue reconstruido desde el repositorio actualizado."
        });

      } else {
        toast.success("Cambios guardados", {
          id: "save-project",
          description: "Los cambios se aplicaron correctamente."
        });
      }

      router.push(`/projects/${formData.id}`);

    } catch (error: any) {
      console.error("Error al guardar cambios:", error);

      toast.error("Error al actualizar", {
        description: error.message
      });

    } finally {
      setLoading(false);

      toast.dismiss("save-project");
      toast.dismiss("redeploy");
    }
  };



  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Cargando la configuración del proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 bg-card rounded-2xl shadow-lg max-w-md text-center border border-destructive/50">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Crítico de Carga</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/home")} variant="outline">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header showAuth onLogout={() => router.push("/")} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/home")}
            className="mb-6 hover:bg-primary/10 hover:text-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                Editar Proyecto
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">Actualiza la configuración de tu proyecto</p>

            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">ID:</span>
                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{formData.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Template:</span>
                <span className="font-semibold bg-chart-2/10 px-2 py-1 rounded text-xs text-chart-2">
                  {mapTemplateType(projectInfo?.template || "")}
                </span>
              </div>
            </div>

          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-primary">Información básica</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground text-base">
                    Nombre del proyecto
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="mi-proyecto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-background border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground text-base">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu proyecto..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors min-h-24"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-accent">Repositorio</h2>

              <div className="space-y-2">
                <Label htmlFor="repoUrl" className="text-foreground text-base">
                  URL del repositorio de GitHub
                </Label>
                <Input
                  id="repoUrl"
                  type="url"
                  placeholder="https://github.com/usuario/proyecto"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  required
                  className="bg-background border-border focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/projects/${resolvedParams.id}`)}
                className="flex-1 py-6 text-lg hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !hasChanges}
                className="flex-1 bg-gradient-to-r from-secondary via-accent to-primary hover:opacity-90 transition-all transform hover:scale-[1.02] py-6 text-lg font-semibold shadow-lg shadow-secondary/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
