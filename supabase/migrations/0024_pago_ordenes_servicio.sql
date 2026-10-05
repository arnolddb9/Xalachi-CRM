-- Las órdenes de servicio ahora registran si el cliente ya pagó,
-- igual que `estado_pago` en `ventas`.

alter table public.ordenes_servicio
  add column estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente', 'pagado'));
