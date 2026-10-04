"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Md3Button } from "@/components/md3/button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Md3Button variant="outlined" onClick={handleLogout} minWidth={120}>
      Cerrar sesión
    </Md3Button>
  );
}
