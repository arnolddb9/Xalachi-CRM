import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { SidebarProvider } from "@/components/sidebar-context";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // getUser() valida el token contra el servidor de Auth; getSession() no lo hace
  // y no debe usarse para decidir acceso (ver advertencia de supabase-js).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </SidebarProvider>
  );
}
