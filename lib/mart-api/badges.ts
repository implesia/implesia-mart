import { readAdminBadge, type AdminBadge, type BadgeTone } from "@/lib/mart-api/badge-rules";
import { authorizedFetch, MartApiError, readError } from "@/lib/mart-api/products";

const BASE = "/api/v1/admin/badges";

export type BadgeInput = { name: string; tone: BadgeTone; isActive: boolean };

async function call(path: string, init: RequestInit | undefined, fallback: string) {
  const response = await authorizedFetch(path, init);
  if (response.status === 401) throw new MartApiError("Sign in again to manage badges.");
  if (!response.ok) throw new MartApiError(await readError(response, fallback));
  return response;
}

function json(method: string, body: Record<string, unknown>): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function parsed(body: unknown, fallback: string): AdminBadge {
  const badge = readAdminBadge(body);
  if (!badge) throw new MartApiError(fallback);
  return badge;
}

export async function listMartBadges(): Promise<AdminBadge[]> {
  const response = await call(BASE, undefined, "Could not load badges.");
  const body = (await response.json()) as { items?: unknown[] };
  return (body.items ?? []).flatMap((item) => {
    const badge = readAdminBadge(item);
    return badge ? [badge] : [];
  });
}

export async function createMartBadge(input: BadgeInput): Promise<AdminBadge> {
  const response = await call(
    BASE,
    json("POST", { name: input.name, tone: input.tone, is_active: input.isActive }),
    "The badge could not be created.",
  );
  return parsed(await response.json(), "The badge could not be created.");
}

export async function updateMartBadge(
  id: string,
  input: Partial<BadgeInput>,
): Promise<AdminBadge> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.tone !== undefined) body.tone = input.tone;
  if (input.isActive !== undefined) body.is_active = input.isActive;
  const response = await call(
    `${BASE}/${encodeURIComponent(id)}`,
    json("PATCH", body),
    "The badge could not be saved.",
  );
  return parsed(await response.json(), "The badge could not be saved.");
}

export async function deleteMartBadge(id: string): Promise<void> {
  await call(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "The badge could not be deleted.",
  );
}
