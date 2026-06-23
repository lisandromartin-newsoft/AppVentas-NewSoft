# Newsoft Sales

Sistema interno de gestión de ventas y cotizaciones para Newsoft Technologies.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** + **PostgreSQL** (Docker en local; gestionado en staging/producción)
- **Autenticación propia por cookie/JWT** (firmada con `jose`) — ver `lib/session.ts` y `lib/access-control.ts`
- **recharts** (gráficas) · **@react-pdf/renderer** + **puppeteer-core** (generación de PDF)
- **Jest** (pruebas) · **Docker** + **Terraform** (despliegue en producción: AWS Lightsail)

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

## Despliegue

El sistema usa tres entornos:

| Entorno | Dónde | Base de datos | Para qué |
|---|---|---|---|
| **Local** | Tu máquina | PostgreSQL en Docker | Desarrollo |
| **Staging** | Vercel | PostgreSQL de staging (separada) | Pruebas / demos al cliente |
| **Producción** | AWS Lightsail | PostgreSQL gestionado de Lightsail | Clientes reales |

### Producción — AWS Lightsail

La app que usan los clientes corre en **AWS Lightsail** (Docker + PostgreSQL gestionado).
El despliegue se hace con **Terraform** desde `infra/lightsail`: empaqueta el código, lo sube
por SSH, construye la imagen Docker, aplica migraciones (`prisma migrate deploy`) y levanta el
contenedor. Ver `infra/lightsail/README.md` y **[docs/operaciones/](docs/operaciones/)**.

> ⚠️ No hay CI/CD automático: el despliegue se ejecuta manualmente con `terraform apply`.
> Mergear a `main` **no** despliega a producción por sí solo.

### Staging — Vercel

Vercel está conectado al repo y genera **preview deployments** por rama/PR, útiles para mostrar
avances sin tocar producción. Usa una base de datos de **staging** (nunca la de clientes).
Variables en **Vercel → Project → Settings → Environment Variables**
(`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SESSION_SECRET`).

---

## Flujo de trabajo

`main` está **protegido**: no se hace push directo. Todo cambio entra por Pull Request
desde una rama `feature/`, `fix/` o `chore/`. Ver **[docs/FLUJO-GIT.md](docs/FLUJO-GIT.md)**.

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
