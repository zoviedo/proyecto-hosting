"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"


const projectTypes = [
  {
    id: "html_css_js",
    name: "HTML/CSS/JS",
    description: "Sitio web estático con HTML, CSS y JavaScript",
    templateRepo: "https://github.com/vanediazdelahoz/template-html-css-js",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: "from-accent to-accent/50",
  },
  {
    id: "react",
    name: "React",
    description: "Aplicación React con Vite o Create React App",
    templateRepo: "https://github.com/zoviedo/template-react",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03.6 0 1.17 0 1.71-.03.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26 0-.73-1.18-1.63-3.28-2.26-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26 0 .73 1.18 1.63 3.28 2.26.25-.76.55-1.51.89-2.26m9.03 4.95l-.29.51c.31.05.61.1.88.16-.07-.28-.18-.57-.29-.86l-.3.19z" />
      </svg>
    ),
    gradient: "from-primary to-primary/50",
  },
  {
    id: "flask",
    name: "Flask",
    description: "API o aplicación web con Python Flask",
    templateRepo: "https://github.com/UnUsuarioOfGitHub/template-flask",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 2v2.5C7 5.88 5.88 7 4.5 7H2v2h2.5C5.88 9 7 10.12 7 11.5V14c0 1.1.9 2 2 2h2v-2H9v-2.5c0-1.1-.45-2.1-1.17-2.83.72-.73 1.17-1.73 1.17-2.83V4h2v2h2V2H7m10 10v-2h-2v2h-2v2h2v2h2v-2h2v-2h-2z" />
      </svg>
    ),
    gradient: "from-secondary to-secondary/50",
  },
]

export default function CreateProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    repoUrl: "",
    integrateRoble: false,
    robleProjectCode: "",
    robleCredentials: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const API_URL = "http://localhost:3001"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error("Selecciona un tipo de proyecto");
      return;
    }

    if (formData.name.includes(" ")) {
      toast.error("El nombre del proyecto no debe contener espacios");
      return;
    }

    const dockerNameRegex = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
    if (!dockerNameRegex.test(formData.name)) {
      toast.error("Nombre inválido", {
        description:
          "Usa solo minúsculas, números, '-', '_', '.', y no inicies ni termines con símbolos.",
      });
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken || !refreshToken) {
      toast.error("Sesión expirada", {
        description: "Vuelve a iniciar sesión.",
      });
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectName: formData.name.toLowerCase(),
          description: formData.description,
          urlRepo: formData.repoUrl,
          templateType: formData.type,
          refreshToken: refreshToken,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setLoading(false);
        toast.error("El proyecto ya existe", {
          description: "Debes elegir un nombre distinto.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Error al desplegar el proyecto.");
      }

      if (data.newAccessToken) {
        localStorage.setItem("accessToken", data.newAccessToken);
      }

      toast.success("Proyecto desplegado 🚀", {
        description: "Serás redirigido al panel principal.",
        duration: 2000,
      });

      setTimeout(() => {
        router.push("/home");
      }, 2000);

    } catch (err: any) {
      console.error("Error de despliegue:", err);

      toast.error("No se pudo desplegar el proyecto", {
        description: err.message || "Error inesperado.",
      });

    } finally {
      setLoading(false);
    }
  };


  const selectedTemplate = projectTypes.find(t => t.id === formData.type)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header showAuth onLogout={() => router.push("/")} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 hover:bg-primary/10 hover:text-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Button>

            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Crear Nuevo Proyecto
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">Configura y despliega tu proyecto en minutos</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información básica */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-primary">1. Información básica</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground text-base">
                    Nombre del proyecto (sin espacios)
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
                    Descripción (Opcional)
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

            {/* Tipo de proyecto */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-secondary">2. Elige un Template</h2>

              <div className="grid md:grid-cols-3 gap-4">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: type.id });
                      setError("");
                    }}
                    className={`relative group p-6 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${formData.type === type.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                      : "border-border hover:border-primary/50 bg-background"
                      }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4 text-background shadow-lg mx-auto`}
                    >
                      {type.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{type.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>

                    {formData.type === type.id && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Repositorio */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-accent">3. Conecta tu Repositorio</h2>

              {selectedTemplate ? (
                <div className="mb-6 p-6 bg-accent/5 border border-accent/20 rounded-xl">
                  <h4 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pasos obligatorios:
                  </h4>
                  <ol className="list-decimal list-inside text-base text-muted-foreground space-y-3 mb-4">
                    <li>Ve al repositorio base haciendo clic en el botón de abajo.</li>
                    <li>Usa el botón <strong>"Use this template"</strong> o <strong>"Fork"</strong> en GitHub para crear una copia en TU cuenta.</li>
                  </ol>

                  <a
                    href={selectedTemplate.templateRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Abrir Template en GitHub ↗
                  </a>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted/50 border border-border rounded-xl flex items-center gap-3">
                  <span className="text-2xl">☝️</span>
                  <p className="text-sm text-muted-foreground">
                    Selecciona un tipo de proyecto arriba para ver las instrucciones.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="repoUrl" className="text-foreground text-base">
                  URL de tu repositorio
                </Label>
                <Input
                  id="repoUrl"
                  type="url"
                  placeholder="https://github.com/TU_USUARIO/tu-proyecto-forkeado.git"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  required
                  className="bg-background border-border focus:border-accent transition-colors"
                />
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3 items-start">
                  <span className="text-lg">⚠️</span>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    <p className="font-bold mb-1">¡Atención!</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>El repositorio debe ser <strong>PÚBLICO</strong> (o el despliegue fallará).</li>
                      <li>En tu repositorio, haz clic en el botón verde <strong>"Code"</strong> y copia la URL que termina en <strong>.git</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 py-6 text-lg hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all transform hover:scale-[1.02] py-6 text-lg font-semibold shadow-lg shadow-primary/30"
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
                    Desplegando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Crear y Desplegar
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