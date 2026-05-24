import { afterEach, describe, expect, it } from "vitest";
import { getSupabasePublishableKey, getSupabaseSecretKey } from "@/lib/supabase-keys";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Supabase key helpers", () => {
  it("prefers new publishable keys over legacy anon keys", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_new";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon";

    expect(getSupabasePublishableKey()).toBe("sb_publishable_new");
  });

  it("falls back to legacy anon keys", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon";

    expect(getSupabasePublishableKey()).toBe("legacy_anon");
  });

  it("prefers new secret keys over legacy service role keys", () => {
    process.env.SUPABASE_SECRET_KEY = "sb_secret_new";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service";

    expect(getSupabaseSecretKey()).toBe("sb_secret_new");
  });

  it("falls back to legacy service role keys", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service";

    expect(getSupabaseSecretKey()).toBe("legacy_service");
  });
});
