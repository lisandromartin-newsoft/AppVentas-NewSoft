import { redirect } from "next/navigation";

/**
 * Página raíz — redirige al dashboard de ventas.
 * En la Fase 9 (Auth) esto cambiará para ir al login si no hay sesión.
 */
export default function Home() {
  redirect("/ventas");
}
