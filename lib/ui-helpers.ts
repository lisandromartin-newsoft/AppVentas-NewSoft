/**
 * Helpers para UI: colores de badges, iniciales de avatar, etc.
 */

// Paleta de colores para badges de condición de pago y avatares
const BADGE_PALETTES = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
];

const AVATAR_PALETTES = [
  { bg: "bg-blue-600", text: "text-white" },
  { bg: "bg-purple-600", text: "text-white" },
  { bg: "bg-teal-600", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-rose-600", text: "text-white" },
  { bg: "bg-indigo-600", text: "text-white" },
  { bg: "bg-green-600", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
];

/** Hash determinístico de un string → índice de paleta */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash);
}

/** Clases Tailwind para badge de condición de pago */
export function getCondicionBadgeClasses(nombre: string): string {
  const idx = hashString(nombre) % BADGE_PALETTES.length;
  const { bg, text } = BADGE_PALETTES[idx];
  return `${bg} ${text}`;
}

/** Clases Tailwind para avatar de cliente */
export function getAvatarClasses(nombre: string): string {
  const idx = hashString(nombre) % AVATAR_PALETTES.length;
  const { bg, text } = AVATAR_PALETTES[idx];
  return `${bg} ${text}`;
}

/** Obtiene las iniciales de un nombre de empresa (máx 2 letras) */
export function getInitials(nombre: string): string {
  const words = nombre.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
