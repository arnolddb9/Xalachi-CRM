"use client";

import dynamic from "next/dynamic";

const LoginMd3Vista = dynamic(
  () => import("./login-md3-vista").then((m) => m.LoginMd3Vista),
  { ssr: false, loading: () => <div className="from-sidebar min-h-screen bg-gradient-to-br to-slate-700" /> },
);

export function LoginMd3Cargador() {
  return <LoginMd3Vista />;
}
