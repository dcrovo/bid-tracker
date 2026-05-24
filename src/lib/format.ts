import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DeadlineHealth } from "@/lib/types";

export function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function shortDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: es });
}

export function deadlineHealth(deadline: string): DeadlineHealth {
  const days = differenceInCalendarDays(parseISO(deadline), new Date());
  if (days < 0) return "vencido";
  if (days <= 2) return "urgente";
  if (days <= 7) return "proximo";
  return "vigente";
}

export function daysUntil(deadline: string) {
  return differenceInCalendarDays(parseISO(deadline), new Date());
}
