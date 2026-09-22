// Declaraciones mínimas para usar los Web Components de @material/web dentro
// de JSX/TSX. Son Custom Elements reales (no componentes React), así que
// React 19 los renderiza pasando las props como atributos/propiedades del
// elemento del DOM — de ahí el tipado laxo (cualquier prop, cualquier hijo).
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type Md3ElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [prop: string]: unknown;
};

// React 19 / @types/react 19 resolve JSX via `React.JSX`, no longer via the
// ambient global `JSX` namespace — hay que aumentar el módulo "react".
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-elevated-card": Md3ElementProps;
      "md-outlined-card": Md3ElementProps;
      "md-filled-card": Md3ElementProps;
      "md-filled-button": Md3ElementProps;
      "md-outlined-button": Md3ElementProps;
      "md-text-button": Md3ElementProps;
      "md-filled-tonal-button": Md3ElementProps;
      "md-chip-set": Md3ElementProps;
      "md-assist-chip": Md3ElementProps;
      "md-filter-chip": Md3ElementProps;
      "md-tabs": Md3ElementProps;
      "md-primary-tab": Md3ElementProps;
      "md-outlined-select": Md3ElementProps;
      "md-select-option": Md3ElementProps;
      "md-outlined-text-field": Md3ElementProps;
      "md-divider": Md3ElementProps;
      "md-checkbox": Md3ElementProps;
    }
  }
}
