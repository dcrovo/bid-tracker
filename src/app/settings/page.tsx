import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Sistema</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Ajustes</h1>
      </div>
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Setting label="Supabase" value="Configurar NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY y SUPABASE_SECRET_KEY" />
          <Setting label="SECOP" value="Opcional: SECOP_SOCRATA_APP_TOKEN para mayor cuota en datos.gov.co" />
          <Setting label="OpenAI" value="OPENAI_API_KEY para resumen y extraccion documental" />
          <Setting label="Alertas" value="Email primero; WhatsApp en una fase posterior" />
        </div>
      </Panel>
    </AppShell>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-4">
      <div className="font-semibold">{label}</div>
      <div className="mt-2 text-sm text-stone-600">{value}</div>
    </div>
  );
}
