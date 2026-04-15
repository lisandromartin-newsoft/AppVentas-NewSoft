"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, CreditCard } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Toast, { ToastData } from "@/components/ui/Toast";
import type { CondicionComercial } from "@/types/configuracion";

interface TabCondicionesProps {
  initialCondiciones: CondicionComercial[];
}

interface FormState {
  nombre: string;
  dias_credito: string; // string para input, convertir a number|null al guardar
  descripcion: string;
  activo: boolean;
}

const emptyForm: FormState = {
  nombre: "",
  dias_credito: "",
  descripcion: "",
  activo: true,
};

export default function TabCondiciones({ initialCondiciones }: TabCondicionesProps) {
  const [condiciones, setCondiciones] = useState<CondicionComercial[]>(initialCondiciones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondicion, setEditingCondicion] = useState<CondicionComercial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const openCreate = () => {
    setEditingCondicion(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (condicion: CondicionComercial) => {
    setEditingCondicion(condicion);
    setForm({
      nombre: condicion.nombre,
      dias_credito:
        condicion.dias_credito !== null ? String(condicion.dias_credito) : "",
      descripcion: condicion.descripcion ?? "",
      activo: condicion.activo,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCondicion(null);
    setFormError("");
  };

  const handleToggleActivo = async (condicion: CondicionComercial) => {
    try {
      const res = await fetch(
        `/api/configuracion/condiciones/${condicion.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: condicion.nombre,
            dias_credito: condicion.dias_credito,
            descripcion: condicion.descripcion,
            activo: !condicion.activo,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Error al actualizar" });
        return;
      }

      const updated: CondicionComercial = await res.json();
      setCondiciones((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setToast({
        type: "success",
        message: updated.activo
          ? `"${updated.nombre}" activada`
          : `"${updated.nombre}" desactivada`,
      });
    } catch {
      setToast({ type: "error", message: "Error de conexión" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setFormError("El nombre es requerido");
      return;
    }

    setIsSaving(true);
    setFormError("");

    // Parsear días de crédito
    const diasCreditoRaw = form.dias_credito.trim();
    const dias_credito =
      diasCreditoRaw === "" ? null : parseInt(diasCreditoRaw, 10);

    if (diasCreditoRaw !== "" && (isNaN(dias_credito!) || dias_credito! < 0)) {
      setFormError("Los días de crédito deben ser un número mayor o igual a 0");
      setIsSaving(false);
      return;
    }

    try {
      const isEditing = editingCondicion !== null;
      const url = isEditing
        ? `/api/configuracion/condiciones/${editingCondicion.id}`
        : "/api/configuracion/condiciones";
      const method = isEditing ? "PUT" : "POST";

      const body = {
        nombre: form.nombre.trim(),
        dias_credito,
        descripcion: form.descripcion.trim() || null,
        ...(isEditing && { activo: form.activo }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Error al guardar");
        return;
      }

      if (isEditing) {
        setCondiciones((prev) =>
          prev.map((c) => (c.id === data.id ? data : c))
        );
        setToast({ type: "success", message: "Condición actualizada correctamente" });
      } else {
        setCondiciones((prev) => [...prev, data]);
        setToast({ type: "success", message: "Condición creada correctamente" });
      }

      closeModal();
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const activas = condiciones.filter((c) => c.activo);
  const inactivas = condiciones.filter((c) => !c.activo);

  return (
    <>
      {toast && <Toast {...toast} onClose={closeToast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Define las condiciones de pago disponibles para clientes y órdenes.
        </p>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Agregar condición
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                Días crédito
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Descripción
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                Estado
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {condiciones.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-400 text-sm"
                >
                  No hay condiciones comerciales registradas
                </td>
              </tr>
            )}

            {activas.map((condicion) => (
              <CondicionRow
                key={condicion.id}
                condicion={condicion}
                onEdit={openEdit}
                onToggle={handleToggleActivo}
              />
            ))}

            {inactivas.length > 0 && activas.length > 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Inactivas
                  </span>
                </td>
              </tr>
            )}

            {inactivas.map((condicion) => (
              <CondicionRow
                key={condicion.id}
                condicion={condicion}
                onEdit={openEdit}
                onToggle={handleToggleActivo}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      {isModalOpen && (
        <Modal
          title={
            editingCondicion
              ? "Editar condición comercial"
              : "Nueva condición comercial"
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                autoFocus
                className={`input ${formError && !form.nombre.trim() ? "border-red-400" : ""}`}
                value={form.nombre}
                onChange={(e) => {
                  setForm((f) => ({ ...f, nombre: e.target.value }));
                  setFormError("");
                }}
                placeholder="Ej: 50% inicio / 50% entrega"
              />
            </div>

            <div>
              <label className="label">
                Días de crédito
                <span className="text-gray-400 font-normal ml-1">(vacío = contado)</span>
              </label>
              <input
                className="input w-40"
                type="number"
                min={0}
                value={form.dias_credito}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dias_credito: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Descripción opcional de la condición de pago..."
              />
            </div>

            {/* Toggle activo solo en edición */}
            {editingCondicion && (
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Estado</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.activo}
                  onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${form.activo ? "bg-navy" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                      ${form.activo ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            )}

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving
                  ? "Guardando..."
                  : editingCondicion
                  ? "Guardar cambios"
                  : "Crear condición"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ── Sub-componente: fila de tabla ────────────────────────────
function CondicionRow({
  condicion,
  onEdit,
  onToggle,
}: {
  condicion: CondicionComercial;
  onEdit: (c: CondicionComercial) => void;
  onToggle: (c: CondicionComercial) => void;
}) {
  const diasLabel =
    condicion.dias_credito === null
      ? "Contado"
      : condicion.dias_credito === 0
      ? "Contado"
      : `${condicion.dias_credito} días`;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${!condicion.activo ? "opacity-50" : ""}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-orange shrink-0" />
          <span className="font-medium text-gray-900">{condicion.nombre}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {diasLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 max-w-xs">
        <span className="line-clamp-1">{condicion.descripcion || "—"}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`badge ${
            condicion.activo
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {condicion.activo ? "Activa" : "Inactiva"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(condicion)}
            className="p-1.5 text-gray-400 hover:text-navy hover:bg-navy-50 rounded-md transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onToggle(condicion)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors
              ${
                condicion.activo
                  ? "text-red-500 hover:bg-red-50"
                  : "text-green-600 hover:bg-green-50"
              }`}
            title={condicion.activo ? "Desactivar" : "Activar"}
          >
            {condicion.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
