import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Repositorio</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Documentos</h1>
      </div>
      <Panel>
        <p className="text-sm text-stone-600">
          Este modulo queda preparado para conectar Supabase Storage, descargar pliegos desde SECOP y guardar extracciones IA con citas.
        </p>
      </Panel>
    </AppShell>
  );
}
