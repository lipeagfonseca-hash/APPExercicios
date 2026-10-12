import AppShell from "@/components/AppShell";

// Todas as telas do app (exigem login; o proxy.ts redireciona quem não tem sessão).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
