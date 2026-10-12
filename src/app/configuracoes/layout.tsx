import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import SettingsTabs from "@/components/SettingsTabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) redirect("/dashboard");

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Configurações gerais
      </h1>
      <SettingsTabs />
      {children}
    </div>
  );
}
