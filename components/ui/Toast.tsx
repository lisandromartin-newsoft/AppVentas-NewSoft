"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export interface ToastData {
  type: "success" | "error";
  message: string;
}

interface ToastProps extends ToastData {
  onClose: () => void;
}

export default function Toast({ type, message, onClose }: ToastProps) {
  // Auto-dismiss después de 4 segundos
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className={`
        fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3
        rounded-xl shadow-lg border animate-fade-in min-w-[280px] max-w-sm
        ${
          isSuccess
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }
      `}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="shrink-0 text-green-600" />
      ) : (
        <XCircle size={18} className="shrink-0 text-red-600" />
      )}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`shrink-0 p-0.5 rounded transition-colors
          ${isSuccess ? "hover:bg-green-100" : "hover:bg-red-100"}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
