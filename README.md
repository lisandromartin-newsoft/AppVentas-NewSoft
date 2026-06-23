# Newsoft Sales

Sistema interno de gestión de ventas y cotizaciones para Newsoft Technologies.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** + **PostgreSQL** (AWS Lightsail en producción, Neon en staging)
- **Autenticación propia por cookie/JWT** (firmada con `jose`) — ver `lib/session.ts` y `lib/access-control.ts`
- **recharts** (gráficas) · **@react-pdf/renderer** + **puppeteer-core** (generación de PDF)
- **Jest** (pruebas) · **Docker** + **Terraform** (despliegue alternativo en AWS Lightsail)

---

## Setup local

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd newsoft-sales
npm install   # corre `prisma generate` automáticamente (postinstall)
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales. La app (Next.js runtime) usa estas variables:

| Variable | Descripción |
|---|---|
| `POSTGRES_PRISMA_URL` | URL pooled (pgbouncer, puerto 6543, `?pgbouncer=true`) |
| `POSTGRES_URL_NON_POOLING` | URL directa (puerto 5432), usada por las migraciones |
| `SESSION_SECRET` | Secreto para firmar la sesión JWT. Generar con `openssl rand -base64 32` (mín. 32 chars) |

> **Importante (CLI de Prisma):** `prisma migrate`, `prisma studio`, etc. solo leen `.env`
> (no `.env.local`). El `schema.prisma` espera `POSTGRES_PRISMA_URL` y `POSTGRES_URL_NON_POOLING`,
> así que define esos mismos nombres también en `.env` para que la CLI funcione.

### 3. Migraciones y datos iniciales

```bash
npm run db:migrate    # aplica migraciones en desarrollo
npm run db:seed       # usuarios, empresa, catálogos y datos demo
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → redirige a `/login`.

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción (prisma generate + next build)
npm run lint         # ESLint
npm test             # Pruebas (Jest)
npm run db:generate  # Regenerar cliente Prisma tras cambios de schema
npm run db:migrate   # Nueva migración en desarrollo
npm run db:seed      # Seed de datos iniciales
npm run db:studio    # Prisma Studio (explorador visual de la BD)
npm run db:reset     # Reset completo (destructivo)
npm run user:role    # Asignar rol a un usuario (scripts/set-user-role.ts)
```

---

## Ambientes

| Ambiente | Dónde | Base de datos | Cómo se actualiza |
|---|---|---|---|
| **Local** | `localhost:3001` (Docker) | PostgreSQL en Docker (`localhost:5433`) | `npm run dev` |
| **Staging / demo** | `app-ventas-new-soft.vercel.app` | Neon (free tier) | Automático en cada push / PR |
| **Producción** | AWS Lightsail (`13.218.0.179`) | Lightsail Managed PostgreSQL | Manual: `terraform apply` |

> ⚠️ Mergear a `main` **NO despliega automáticamente** a producción. El deploy a Lightsail
> es siempre manual desde `infra/lightsail/` con Terraform.

## Despliegue a producción (Lightsail)

```bash
# 1. Asegurarse de estar en main y sin cambios pendientes
git checkout main && git pull

# 2. Plan (ver qué cambia sin aplicar)
C:\Users\Usuario\bin\terraform.exe -chdir=infra/lightsail plan -out=tfplan

# 3. Aplicar (empaqueta repo → SSH → Docker build → prisma migrate deploy)
C:\Users\Usuario\bin\terraform.exe -chdir=infra/lightsail apply tfplan

# 4. Verificar
ssh -i ~/.ssh/newsoft_lightsail ubuntu@13.218.0.179 "sudo -n docker ps && sudo -n docker logs --tail=20 newsoft-sales-app"
```

Requiere: credenciales AWS en `~/.aws/credentials`, `terraform.tfvars` y `terraform.tfstate`
en `infra/lightsail/` (gitignored — ver `C:\Users\Usuario\newsoft-handoff\`).

## Despliegue a staging (Vercel)

Automático: cada push a cualquier rama genera una URL de preview.
Para promover a la URL principal (`app-ventas-new-soft.vercel.app`):

```bash
vercel deploy --prod
```

Variables de entorno en **Vercel → Project → Settings → Environment Variables**:
`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SESSION_SECRET`.

---

## Flujo de trabajo

`main` está **protegido**: no se hace push directo. Todo cambio entra por Pull Request
desde una rama `feature/`, `fix/` o `chore/`.

---

## Estructura del proyecto

```
app/
  (dashboard)/      # Rutas protegidas (ventas, clientes, reportes, configuración)
  api/              # Route handlers (incl. import, reportes, configuración)
  login/            # Página de inicio de sesión
components/
  layout/           # Sidebar
  ordenes/          # Formularios y tablas de órdenes
  clientes/         # Gestión de clientes
  reportes/         # Gráficas y tablas de reportes
  configuracion/    # Tabs (empresa, tipos, condiciones, usuarios, vendedores)
  pdf/              # Template PDF de cotización
  ui/               # Componentes reutilizables (MultiSelect, Modal, etc.)
lib/
  session.ts        # Sesión por cookie/JWT
  access-control.ts # Roles y permisos
  net-amounts.ts    # Cálculo de montos netos sin IVA
  filter-utils.ts   # Helpers de filtros y rangos de fecha
  prisma.ts         # Singleton Prisma Client
prisma/
  schema.prisma     # Modelos de datos
  migrations/        # Historial de migraciones SQL
  seed.ts           # Datos iniciales
__tests__/          # Pruebas (Jest)
infra/lightsail/    # Terraform para despliegue en AWS Lightsail
types/              # Tipos TypeScript compartidos
```
