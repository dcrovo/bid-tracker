import { describe, expect, it, vi } from "vitest";
import { deadlineHealth, daysUntil } from "@/lib/format";

describe("deadline helpers", () => {
  it("classifies expired, urgent, upcoming, and active deadlines", () => {
    vi.setSystemTime(new Date("2026-05-20T12:00:00.000Z"));

    expect(deadlineHealth("2026-05-19T00:00:00.000Z")).toBe("vencido");
    expect(deadlineHealth("2026-05-22T00:00:00.000Z")).toBe("urgente");
    expect(deadlineHealth("2026-05-26T00:00:00.000Z")).toBe("proximo");
    expect(deadlineHealth("2026-06-15T00:00:00.000Z")).toBe("vigente");
    expect(daysUntil("2026-05-26T00:00:00.000Z")).toBe(6);

    vi.useRealTimers();
  });
});
