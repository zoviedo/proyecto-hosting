"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"


interface Project {
  id: string
  name: string
  description: string
  type: string
  status: "active" | "stopped"
  url: string
}

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  estado_real?: string
}

export function ProjectCard({ project, onDelete, onToggleStatus, estado_real }: ProjectCardProps) {

  const isRunning = estado_real === 'running';
  const isNotFound = estado_real === 'not_found';

  const getTypeColor = (type: string) => {
    switch (type) {
      case "React":
        return "from-primary to-primary/50"
      case "Flask":
        return "from-secondary to-secondary/50"
      case "HTML/CSS/JS":
        return "from-accent to-accent/50"
      default:
        return "from-primary to-secondary"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "React":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03.6 0 1.17 0 1.71-.03.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26 0-.73-1.18-1.63-3.28-2.26-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26 0 .73 1.18 1.63 3.28 2.26.25-.76.55-1.51.89-2.26m9.03 4.95l-.29.51c.31.05.61.1.88.16-.07-.28-.18-.57-.29-.86l-.3.19z" />
          </svg>
        )
      case "Flask":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v2.5C7 5.88 5.88 7 4.5 7H2v2h2.5C5.88 9 7 10.12 7 11.5V14c0 1.1.9 2 2 2h2v-2H9v-2.5c0-1.1-.45-2.1-1.17-2.83.72-.73 1.17-1.73 1.17-2.83V4h2v2h2V2H7m10 10v-2h-2v2h-2v2h2v2h2v-2h2v-2h-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )
    }
  }

  const getStatusBadge = () => {
    if (isNotFound) {
      return { text: "⏸︎ Inactivo", class: "bg-chart-5/20 text-chart-5 border border-chart-5/30" };
    }
    if (isRunning) {
      return { text: "● Activo", class: "bg-primary/20 text-primary border border-primary/30" };
    }
    return { text: "○ Detenido", class: "bg-muted text-muted-foreground border border-border" };
  }

  const badge = getStatusBadge();

  const hasDescription = project.description && project.description.trim().length > 0;

  return (
    <div className="group relative h-full">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${getTypeColor(project.type)} opacity-0 group-hover:opacity-20 rounded-2xl blur transition duration-300`}
      ></div>

      <div className="relative flex flex-col justify-between h-full min-h-[280px] p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(project.type)} flex items-center justify-center shadow-lg`}
              >
                <div className="text-background">{getTypeIcon(project.type)}</div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{project.name}</h3>
                <span className="text-xs text-muted-foreground">{project.type}</span>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}
            >
              {badge.text}
            </div>
          </div>

          <div className="mb-2">
            <span className="text-sm bg-muted px-2 py-1 rounded font-mono">
              ID: {project.id}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Link
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ring hover:underline truncate"
            >
              {project.url}
            </Link>
          </div>

          {hasDescription && (
            <p className="text-muted-foreground mb-6 leading-relaxed max-h-20 overflow-hidden text-ellipsis line-clamp-3">
              {project.description}
            </p>
          )}

        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
          <Link href={`/projects/${project.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/50 bg-transparent"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Ver
            </Button>
          </Link>

          <Link href={`/projects/${project.id}/edit`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full hover:bg-secondary/10 hover:text-secondary hover:border-secondary/50 bg-transparent"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            disabled={isNotFound}
            onClick={() => onToggleStatus(project.id)}
            className={`flex-1 ${isRunning
              ? "hover:bg-accent/10 hover:text-accent hover:border-accent/50"
              : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              }`}
          >
            {isRunning ? "Detener" : "Iniciar"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El proyecto <b>{project.name}</b> se borrará permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>

                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/80"
                  onClick={async () => {
                    try {
                      await onDelete(project.id)

                      toast.success("Proyecto eliminado", {
                        description: `El proyecto "${project.name}" se eliminó correctamente.`,
                        duration: 2000,
                      })
                    } catch (error: any) {
                      toast.error("No se pudo eliminar", {
                        description: error.message ?? "Error inesperado.",
                        duration: 2000,
                      })
                    }
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </div>
  )
}