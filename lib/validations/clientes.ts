import { z } from "zod";

export const clienteCreateSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(200),
  rfc: z
    .string()
    .min(12, "RFC inválido (12-13 caracteres)")
    .max(13, "RFC inválido (12-13 caracteres)")
    .regex(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido"),
  contacto: z.string().min(1, "Contacto requerido").max(150),
  ciudad: z.string().min(1, "Ciudad requerida").max(100),
  email: z.string().email("Email inválido").max(100),
  telefono: z
    .string()
    .max(20)
    .nullable()
    .optional()
    .transform((v) => v?.trim() || null),
  condicion_pago_id: z.string().uuid("Condición de pago requerida"),
  notas: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v?.trim() || null),
});

// Update es igual a create (todos los campos editables)
export const clienteUpdateSchema = clienteCreateSchema;

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
