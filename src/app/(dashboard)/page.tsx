import { redirect } from "next/navigation";

// La homepage reindirizza al login.
// La dashboard vera è in /dashboard (src/app/(dashboard)/dashboard/page.tsx)
export default function RootPage() {
  redirect("/login");
}