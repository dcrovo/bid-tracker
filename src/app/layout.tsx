import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAMOD Licitaciones",
  description: "Inteligencia de licitaciones para construccion, arquitectura y consultoria."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
