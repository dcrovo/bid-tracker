'use client';

import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import { camodProfile } from "@/lib/company-profile";
import { money } from "@/lib/format";
import type { CompanyProfile } from "@/lib/types";

const STORAGE_KEY = "camod.companyProfile.v1";

type EditableProfile = Omit<CompanyProfile, "services" | "targetDepartments" | "preferredModalities" | "positiveKeywords" | "excludedKeywords"> & {
  services: string;
  targetDepartments: string;
  preferredModalities: string;
  positiveKeywords: string;
  excludedKeywords: string;
};

function toEditable(profile: CompanyProfile): EditableProfile {
  return {
    ...profile,
    services: profile.services.join(", "),
    targetDepartments: profile.targetDepartments.join(", "),
    preferredModalities: profile.preferredModalities.join(", "),
    positiveKeywords: profile.positiveKeywords.join(", "),
    excludedKeywords: profile.excludedKeywords.join(", ")
  };
}

function toProfile(profile: EditableProfile): CompanyProfile {
  const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
  return {
    ...profile,
    minValue: Number(profile.minValue) || 0,
    maxValue: Number(profile.maxValue) || 0,
    services: split(profile.services),
    targetDepartments: split(profile.targetDepartments),
    preferredModalities: split(profile.preferredModalities),
    positiveKeywords: split(profile.positiveKeywords),
    excludedKeywords: split(profile.excludedKeywords)
  };
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<EditableProfile>(() => toEditable(camodProfile));
  const [saved, setSaved] = useState(false);
  const [storageSource, setStorageSource] = useState("local");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setProfile(toEditable(JSON.parse(stored) as CompanyProfile));

    fetch("/api/company-profile")
      .then((response) => response.json())
      .then((payload: { source?: string; profile?: CompanyProfile }) => {
        if (payload.profile) {
          setProfile(toEditable(payload.profile));
          setStorageSource(payload.source ?? "api");
        }
      })
      .catch(() => undefined);
  }, []);

  function update<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const normalized = toProfile(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    try {
      const response = await fetch("/api/company-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized)
      });
      const payload = (await response.json()) as { source?: string };
      setStorageSource(payload.source ?? (response.ok ? "api" : "local"));
    } catch {
      setStorageSource("local");
    }

    setSaved(true);
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(toEditable(camodProfile));
    setSaved(false);
  }

  const normalized = toProfile(profile);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" value={profile.name} onChange={(value) => update("name", value)} />
          <NumberField label="Valor minimo" value={profile.minValue} onChange={(value) => update("minValue", value)} />
          <NumberField label="Valor maximo" value={profile.maxValue} onChange={(value) => update("maxValue", value)} />
          <TextArea label="Servicios" value={profile.services} onChange={(value) => update("services", value)} />
          <TextArea label="Departamentos objetivo" value={profile.targetDepartments} onChange={(value) => update("targetDepartments", value)} />
          <TextArea label="Modalidades preferidas" value={profile.preferredModalities} onChange={(value) => update("preferredModalities", value)} />
          <TextArea label="Palabras clave positivas" value={profile.positiveKeywords} onChange={(value) => update("positiveKeywords", value)} />
          <TextArea label="Palabras excluidas" value={profile.excludedKeywords} onChange={(value) => update("excludedKeywords", value)} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={save} className="focus-ring inline-flex items-center gap-2 rounded-md bg-coal px-4 py-2 text-sm font-semibold text-white">
            <Save className="h-4 w-4" /> Guardar perfil
          </button>
          <button onClick={reset} className="focus-ring inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-coal">
            <RotateCcw className="h-4 w-4" /> Restaurar CAMOD
          </button>
          {saved ? <Badge tone="success">Guardado: {storageSource === "supabase" ? "Supabase" : "este navegador"}</Badge> : null}
        </div>
      </Panel>

      <Panel>
        <h2 className="font-semibold">Resumen del perfil</h2>
        <div className="mt-4 space-y-5 text-sm">
          <Preview label="Servicios" values={normalized.services} />
          <Preview label="Departamentos" values={normalized.targetDepartments} />
          <Preview label="Modalidades" values={normalized.preferredModalities} />
          <div>
            <div className="text-stone-500">Rango objetivo</div>
            <div className="mt-1 font-semibold">{money(normalized.minValue)} - {money(normalized.maxValue)}</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-coal">{label}</span>
      <input className="focus-ring mt-2 w-full rounded-md border border-stone-200 bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-coal">{label}</span>
      <input className="focus-ring mt-2 w-full rounded-md border border-stone-200 bg-white px-3 py-2" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm md:col-span-2">
      <span className="font-semibold text-coal">{label}</span>
      <textarea className="focus-ring mt-2 min-h-20 w-full rounded-md border border-stone-200 bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Preview({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="mb-2 text-stone-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <Badge key={value} tone="info">{value}</Badge>)}
      </div>
    </div>
  );
}
