import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AuthUser } from "@/types";

export default async function RootPage() {
  const session = await auth();
  const user = session?.user as AuthUser | undefined;

  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.tenant_id) redirect(`/dashboard/${user.tenant_id}`);

  redirect("/login");
}
