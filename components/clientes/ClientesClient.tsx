"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Users, Search, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Toast, { ToastData } from "@/components/ui/Toast";
import ClienteCard from "./ClienteCard";
import ClienteForm from "./ClienteForm";
import type { ClienteConStats, CondicionResumen } from "@/types/clientes";

interface ClientesClientProps {
  initialClientes: ClienteConStats[];
  condiciones: CondicionResumen[];
}

export default function ClientesClient({
  initialClientes,
  condiciones,
}: ClientesClientProps) {
  const [clientes, setClientes] = useState<ClienteConStats[]>(initialClientes);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteConStats | null>(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState<ClienteConStats | null>(null);
  const [isDesactivando, setIsDesactivando] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  // ── Filtrado por búsqueda ────────────────────────────────────
  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase().trim();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.contacto.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  // ── Abrir modal de creación ──────────────────────────────────
  const handleOpenCreate = () => {
    setEditingCliente(null);
    setIsModalOpen(true);
  };

  // ── Abrir modal de edición ───────────────────────────────────
  const handleOpenEdit = (cliente: ClienteConStats) => {
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  // ── Cerrar modal ─────────────────────────────────────────────
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  // ── Callback de éxito en el formulario ───────────────────────
  const handleFormSuccess = (clienteGuardado: ClienteConStats) => {
    if (editingCliente) {
      // Actualización: reemplaza el cliente existente
      setClientes((prev) =>
        prev.map((c) => (c.id === clienteGuardado.id ? clienteGuardado : c))
      );
      setToast({ type: "success", message: `"${clienteGuardado.nombre}" actualizado` });
    } else {
      // Creación: agrega al principio y re-ordena por nombre
      setClientes((prev) =>
        [...prev, clienteGuardado].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      setToast({ type: "success", message: `"${clienteGuardado.nombre}" creado correctamente` });
    }
    handleCloseModal();
  };

  // ── Desactivar cliente ───────────────────────────────────────
  const handleDesactivarConfirm = async () => {
    if (!confirmDesactivar) return;
    setIsDesactivando(true);

    try {
      const res = await fetch(
        `/api/clientes/${confirmDesactivar.id}/desactivar`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Error al desactivar" });
        return;
      }

      // Remover de la lista (soft delete — ya no aparece en activos)
      setClientes((prev) => prev.filter((c) => c.id !== confirmDesactivar.id));
      setToast({
        type: "success",
        message: `"${confirmDesactivar.nombre}" desactivado`,
      });
    } catch {
      setToast({ type: "error", message: "Error de conexión" });
    } finally {
      setIsDesactivando(false);
      setConfirmDesactivar(null);
    }
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={closeToast} />}

      {/* ── Encabezado de página ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientes.length}{" "}
            {clientes.length === 1 ? "cliente activo" : "clientes activos"}
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary self-start sm:self-auto">
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* ── Barra de búsqueda ── */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          className="input pl-9 max-w-sm"
          placeholder="Buscar por nombre, RFC, contacto o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <span className="ml-3 text-xs text-gray-400">
            {clientesFiltrados.length} resultado
            {clientesFiltrados.length !== 1 && "s"}
          </span>
        )}
      </div>

      {/* ── Grid de cards ── */}
      {clientesFiltrados.length === 0 ? (
        <EmptyState
          hasSearch={!!search}
          onClear={() => setSearch("")}
          onNew={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onEdit={handleOpenEdit}
              onDesactivar={setConfirmDesactivar}
            />
          ))}
        </div>
      )}

      {/* ── Modal: crear / editar cliente ── */}
      {isModalOpen && (
        <Modal
          title={editingCliente ? "Editar cliente" : "Nuevo cliente"}
          onClose={handleCloseModal}
          size="lg"
        >
          <ClienteForm
            cliente={editingCliente ?? undefined}
            condiciones={condiciones}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* ── Modal: confirmar desactivar ── */}
      {confirmDesactivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isDesactivando && setConfirmDesactivar(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in z-10">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy text-base">
                  Desactivar cliente
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Desactivar a{" "}
                  <strong className="text-gray-900">
                    {confirmDesactivar.nombre}
                  </strong>
                  ?
                </p>
                {confirmDesactivar.stats.num_ordenes > 0 && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Este cliente tiene{" "}
                    <strong>{confirmDesactivar.stats.num_ordenes}</strong>{" "}
                    {confirmDesactivar.stats.num_ordenes === 1 ? "orden" : "órdenes"} registradas.
                    El historial se conserva.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  No aparecerá en el formulario de nuevas órdenes.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setConfirmDesactivar(null)}
                disabled={isDesactivando}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesactivarConfirm}
                disabled={isDesactivando}
                className="btn-danger"
              >
                {isDesactivando ? "Desactivando..." : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Estado vacío ─────────────────────────────────────────────
function EmptyState({
  hasSearch,
  onClear,
  onNew,
}: {
  hasSearch: boolean;
  onClear: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Users size={28} className="text-gray-400" />
      </div>
      {hasSearch ? (
        <>
          <p className="text-base font-medium text-gray-700">Sin resultados</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            No hay clientes que coincidan con tu búsqueda.
          </p>
          <button onClick={onClear} className="btn-secondary text-sm">
            Limpiar búsqueda
          </button>
        </>
      ) : (
        <>
          <p className="text-base font-medium text-gray-700">No hay clientes aún</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Agrega tu primer cliente para comenzar.
          </p>
          <button onClick={onNew} className="btn-primary text-sm">
            <Plus size={15} />
            Nuevo cliente
          </button>
        </>
      )}
    </div>
  );
}
