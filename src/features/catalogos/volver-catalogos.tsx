import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function VolverACatalogos() {
  return (
    <Link
      href="/catalogos"
      className="text-primary mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium hover:underline"
    >
      <ArrowLeft size={16} />
      Volver a catálogos
    </Link>
  );
}
