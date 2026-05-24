import { NextResponse } from "next/server";
import { camodProfile } from "@/lib/company-profile";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import type { CompanyProfile } from "@/lib/types";

const PROFILE_SINGLETON_NAME = "CAMOD S.A.S.";

function dbToProfile(row: Record<string, unknown>): CompanyProfile {
  return {
    name: String(row.name ?? PROFILE_SINGLETON_NAME),
    services: (row.services as string[] | null) ?? [],
    targetDepartments: (row.target_departments as string[] | null) ?? [],
    preferredModalities: (row.preferred_modalities as string[] | null) ?? [],
    minValue: Number(row.min_value ?? 0),
    maxValue: Number(row.max_value ?? 0),
    positiveKeywords: (row.positive_keywords as string[] | null) ?? [],
    excludedKeywords: (row.excluded_keywords as string[] | null) ?? []
  };
}

function profileToDb(profile: CompanyProfile) {
  return {
    name: profile.name || PROFILE_SINGLETON_NAME,
    services: profile.services,
    target_departments: profile.targetDepartments,
    preferred_modalities: profile.preferredModalities,
    min_value: profile.minValue,
    max_value: profile.maxValue,
    positive_keywords: profile.positiveKeywords,
    excluded_keywords: profile.excludedKeywords,
    updated_at: new Date().toISOString()
  };
}

export async function GET() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ source: "default", profile: camodProfile });
  }

  const { data, error } = await supabase.from("company_profile").select("*").eq("name", PROFILE_SINGLETON_NAME).maybeSingle();
  if (error) return NextResponse.json({ source: "default", message: error.message, profile: camodProfile }, { status: 206 });
  if (!data) return NextResponse.json({ source: "default", profile: camodProfile });

  return NextResponse.json({ source: "supabase", profile: dbToProfile(data) });
}

export async function PUT(request: Request) {
  const profile = (await request.json()) as CompanyProfile;
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ source: "local", message: "Supabase env vars are not configured; save in browser local storage.", profile }, { status: 202 });
  }

  const payload = profileToDb(profile);
  const { data: existing, error: readError } = await supabase.from("company_profile").select("id").eq("name", PROFILE_SINGLETON_NAME).maybeSingle();
  if (readError) return NextResponse.json({ message: readError.message }, { status: 500 });

  const result = existing?.id
    ? await supabase.from("company_profile").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("company_profile").insert(payload).select("*").single();

  if (result.error) return NextResponse.json({ message: result.error.message }, { status: 500 });
  return NextResponse.json({ source: "supabase", profile: dbToProfile(result.data) });
}
