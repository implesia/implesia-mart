import { redirect } from "next/navigation";

export default async function AdminBannerEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/home/hero/${id}`);
}
