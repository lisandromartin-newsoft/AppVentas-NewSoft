"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ShoppingCart,
  Users,
  Settings,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    href: "/ventas",
    label: "Ventas",
    icon: ShoppingCart,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/ventas") return pathname === "/ventas" || pathname.startsWith("/ventas/");
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col bg-navy text-white shrink-0"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-800">
        <div className="flex items-center justify-center w-8 h-8 bg-orange rounded-lg shrink-0">
          <TrendingUp size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-none">Newsoft</p>
          <p className="text-xs text-navy-200 mt-0.5">Sales</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150 group
                ${
                  active
                    ? "bg-orange text-white"
                    : "text-navy-200 hover:bg-navy-700 hover:text-white"
                }
              `}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight size={14} className="shrink-0 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="px-4 py-4 border-t border-navy-800">
        <p className="text-xs text-navy-300 text-center">
          Newsoft Technologies
        </p>
        <p className="text-xs text-navy-400 text-center mt-0.5">v1.0</p>
      </div>
    </aside>
  );
}
