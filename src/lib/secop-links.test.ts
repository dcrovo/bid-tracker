import { describe, expect, it } from "vitest";
import { secopSearchUrl } from "@/lib/secop-links";

describe("secopSearchUrl", () => {
  it("builds the official SECOP II public search URL", () => {
    const url = new URL(secopSearchUrl());

    expect(url.origin).toBe("https://community.secop.gov.co");
    expect(url.pathname).toBe("/Public/Tendering/ContractNoticeManagement/Index");
    expect(url.searchParams.get("currentLanguage")).toBe("es-CO");
    expect(url.searchParams.get("Page")).toBe("login");
    expect(url.searchParams.get("Country")).toBe("CO");
    expect(url.searchParams.get("SkinName")).toBe("CCE");
  });

  it("includes a search reference when provided", () => {
    const url = new URL(secopSearchUrl("CO1.BDOS.7128401"));

    expect(url.searchParams.get("searchText")).toBe("CO1.BDOS.7128401");
  });
});
