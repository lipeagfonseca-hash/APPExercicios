import type { Metadata } from "next";
import { Space_Grotesk, Inter, Space_Mono } from "next/font/google";
import { getBrand } from "@/lib/brand";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--display-font",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--body-font",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceMono = Space_Mono({
  variable: "--mono-font",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: "SISTEMA",
    description: "Registre treinos, suba de nível e vire o caçador mais forte.",
    ...(brand.favicon ? { icons: { icon: brand.favicon } } : {}),
  };
}

function cssUrl(url: string | null) {
  return url ? `url("${url}")` : undefined;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  const brandVars = {
    "--brand-logo": cssUrl(brand.logo),
    "--brand-login-bg": cssUrl(brand.loginBackground),
    "--brand-login-window": cssUrl(brand.loginWindow),
  } as React.CSSProperties;

  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Fonte dos ícones (subconjunto de ~4 KB, hospedado aqui): carregada já na primeira
            resposta, sem pedir nada a servidores de terceiros. */}
        <link
          rel="preload"
          href="/fonts/material-symbols-icones.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        style={brandVars}
        className="min-h-full bg-surface font-body text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(93,37,199,0.18),rgba(15,19,29,0))]">
        {children}
      </body>
    </html>
  );
}
