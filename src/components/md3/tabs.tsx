"use client";

import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";

export type Md3TabDef = { id: string; label: string };

export function Md3Tabs({
  tabs,
  activo,
  onCambiar,
}: {
  tabs: Md3TabDef[];
  activo: string;
  onCambiar: (id: string) => void;
}) {
  return (
    <md-tabs>
      {tabs.map((t) => (
        <md-primary-tab key={t.id} active={activo === t.id} onClick={() => onCambiar(t.id)}>
          {t.label}
        </md-primary-tab>
      ))}
    </md-tabs>
  );
}
