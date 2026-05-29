# TODOS

Items deferred during the feat/blog engineering review. Each item has context
so it can be picked up months from now without losing the "why".

---

## [SECURITY] Supabase Storage: file naming con UUID + evaluar signed URLs

**What:** Cambiar el naming de archivos subidos de `Date.now()+random` a `crypto.randomUUID()`.
Evaluar si el bucket debe ser privado con signed URLs en vez de público, si en el futuro
se suben documentos sensibles (no solo imágenes de blog).

**Why:** Los nombres actuales son predecibles. Con el host del bucket público, un atacante
puede intentar enumerar archivos. Más crítico: si algún documento legal/sensible se sube
por error al bucket público, no tiene forma de ser "retirado del acceso" sin borrarlo.

**Pros:** Elimina URLs predecibles; un bucket privado con signed URLs permite revocar acceso
sin borrar el archivo.

**Cons:** Signed URLs añaden una capa de complejidad (hay que generar el URL en cada render);
solo necesario si el contenido es sensible. Para imágenes de blog no es urgente.

**Context:** El upload route está en `src/app/api/admin/upload/route.ts`. El bucket actual
se llama `blog-images` y es público. El cambio a UUID es 1 línea. El cambio a signed URLs
requiere cambiar el bucket en Supabase dashboard a "privado" y actualizar todas las places
donde se renderiza el URL de imagen.

**Depends on:** Ninguno. La parte de UUID puede hacerse en cualquier momento sin schema changes.

---

## [SECURITY] JWT session invalidation — documentar procedimiento de emergencia

**What:** Documentar el procedimiento para invalidar una sesión de admin comprometida.
Evaluar implementar JTI blocklist en Supabase si el número de admins crece.

**Why:** Los JWTs duran 7 días y no tienen revocación individual. Si el token es comprometido
(XSS, log leak), el atacante tiene acceso de admin por hasta 7 días. Para 1 admin,
el workaround pragmático es rotar `JWT_SECRET` en Vercel (invalida TODAS las sesiones).

**Pros:** Con blocklist en Supabase, la revocación es granular por sesión individual.

**Cons:** Añade una tabla `jwt_blocklist` y una query extra en cada request de admin.
Overhead significativo para 1 usuario. No vale la pena a menos que haya múltiples admins.

**Context:** La auth está en `src/lib/auth.ts`. El `COOKIE_MAX_AGE` es 7 días.
**Procedimiento de emergencia actual:** Cambiar `JWT_SECRET` en Vercel → redeploy → todas
las sesiones existentes se invalidan automáticamente porque el secret ha cambiado.

**Depends on:** Para el JTI blocklist, necesita una migración de Supabase (tabla nueva).

---

## [TESTING] Tests de API route handlers con mocking

**What:** Escribir tests para los 4 route handlers del admin con NextRequest mockeado
y cliente de Supabase mockeado. Prioridad: `auth/login/route.ts` y el middleware.

**Why:** El código de autenticación y los checks de autorización (401 cuando no hay token,
etc.) quedan sin cobertura automática. Una regresión silenciosa en auth.ts puede dejar
el panel abierto o cerrado sin aviso.

**Pros:** Cobertura completa de los caminos de seguridad críticos. El setup de Vitest para
routes de Next.js es reutilizable una vez configurado.

**Cons:** Requiere ~2-3h de setup inicial: configurar Vitest con `@vitejs/plugin-react`,
mockear `NextRequest` con `new Request(...)`, mockear `@/lib/supabase`.

**Context:** Test files existentes: `src/lib/auth.test.ts`, `src/lib/blog.test.ts`.
Stack: Vitest v3.2.4. Para routes de Next.js, usar `new Request(url, { headers, ... })`
y pasar a los handlers directamente. Ver `src/app/api/admin/auth/login/route.ts` como
primer target — tiene los caminos más críticos (rate limiting, credential check, cookie).

**Priority test cases:**
1. Login con credenciales correctas → 200 + cookie
2. Login con credenciales incorrectas → 401
3. Login sin body / body malformado → 401 (no crash)
4. GET /api/admin/posts sin token → 401
5. GET /api/admin/posts con token válido → 200
6. Middleware: ruta /admin sin token → redirect a /admin/login
7. Middleware: ruta /admin/login → pass through (no redirect loop)

**Depends on:** Ninguno. Los test files existentes muestran el patrón de mocking.
