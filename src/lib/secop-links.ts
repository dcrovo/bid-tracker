const SECOP_PUBLIC_SEARCH = "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index";

export function secopSearchUrl(reference?: string) {
  const url = new URL(SECOP_PUBLIC_SEARCH);
  url.searchParams.set("currentLanguage", "es-CO");
  url.searchParams.set("Page", "login");
  url.searchParams.set("Country", "CO");
  url.searchParams.set("SkinName", "CCE");
  if (reference) url.searchParams.set("searchText", reference);
  return url.toString();
}
