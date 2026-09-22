import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function VolverACatalogos({
  href = "/catalogos",
  label = "Volver a catálogos",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="text-primary mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium hover:underline"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
