import { AppShell } from "@/components/app-shell";
import { ProfileEditor } from "@/components/profile-editor";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Configuracion</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Perfil CAMOD</h1>
        <p className="mt-2 max-w-3xl text-sm text-stone-600">
          Ajusta los criterios que usa el sistema para priorizar licitaciones. En esta version se guarda localmente; el siguiente paso es persistirlo en Supabase por usuario/equipo.
        </p>
      </div>
      <ProfileEditor />
    </AppShell>
  );
}
