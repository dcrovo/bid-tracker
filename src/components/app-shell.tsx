import Link from "next/link";
import { Bell, BriefcaseBusiness, Building2, CalendarDays, FileText, FolderKanban, LayoutDashboard, Search, Settings } from "lucide-react";

const nav = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/opportunities", label: "Oportunidades", icon: Search },
  { href: "/pipeline", label: "Pipeline", icon: FolderKanban },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/entities", label: "Entidades", icon: Building2 },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/profile", label: "Perfil CAMOD", icon: BriefcaseBusiness },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200 bg-coal text-white lg:block">
        <div className="px-6 py-6">
          <div className="text-xs uppercase tracking-[0.22em] text-amber">CAMOD</div>
          <div className="mt-2 text-xl font-semibold">Licitaciones</div>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-200 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-paper/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-stone-500" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Buscar por entidad, objeto, municipio o palabra clave"
              />
            </div>
            <button className="focus-ring rounded-md border border-stone-200 bg-white p-2 text-coal">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
