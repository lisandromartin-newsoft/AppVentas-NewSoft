import Sidebar from "@/components/layout/Sidebar";

/**
 * Layout del dashboard — incluye sidebar de navegación.
 * Todas las rutas bajo (dashboard) heredan este layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
