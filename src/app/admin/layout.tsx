import { cookies } from "next/headers"
import { COOKIE_NAME } from "@/lib/auth"
import { AdminShell } from "@/components/admin/AdminShell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isAuth = !!cookieStore.get(COOKIE_NAME)?.value

  // Login page: render bare — no shell
  if (!isAuth) return <>{children}</>

  return <AdminShell>{children}</AdminShell>
}
