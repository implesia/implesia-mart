import { redirect } from "next/navigation";

export default async function AdminBannersRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  if (status === "live" || status === "off") {
    redirect(`/admin/home/hero?status=${status}`);
  }
  redirect("/admin/home/hero");
}
