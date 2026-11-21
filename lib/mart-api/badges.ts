import { readAdminBadge, type AdminBadge, type BadgeTone } from "@/lib/mart-api/badge-rules";
import { authorizedFetch, MartApiError, readError } from "@/lib/mart-api/products";

const BASE = "/api/v1/admin/badges";

export type BadgeInput = { name: string; tone: BadgeTone; isActive: boolean };

export type BadgeDeleteImpact = {
  badgeName: string;
  isSystem: boolean;
  linkedProductsCount: number;
  sampleProducts: { id: string; title: string }[];
  availableMergeTargets: { id: string; name: string; slug: string }[];
};

export type BadgeDeleteRequest = {
  mode: "unlink" | "merge";
  targetBadgeId?: string | null;
};

export type BadgeDeleteResult = {
  message: string;
  deletedBadgeId: string;
  deletedBadgeName: string;
  mode: "unlink" | "merge";
  affectedProductsCount: number;
  targetBadgeId: string | null;
};

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

export async function fetchBadgeDeleteImpact(id: string): Promise<BadgeDeleteImpact> {
  const response = await call(
    `${BASE}/${encodeURIComponent(id)}/delete-impact`,
    undefined,
    "Could not inspect badge delete impact.",
  );
  const body = (await response.json()) as Record<string, unknown>;
  const sampleProducts = Array.isArray(body.sample_products)
    ? body.sample_products.flatMap((row) => {
        const item = row as Record<string, unknown>;
        return typeof item.id === "string"
          ? [{ id: item.id, title: String(item.title ?? "") }]
          : [];
      })
    : [];
  const availableMergeTargets = Array.isArray(body.available_merge_targets)
    ? body.available_merge_targets.flatMap((row) => {
        const item = row as Record<string, unknown>;
        return typeof item.id === "string"
          ? [{ id: item.id, name: String(item.name ?? ""), slug: String(item.slug ?? "") }]
          : [];
      })
    : [];
  return {
    badgeName: String(body.badge_name ?? ""),
    isSystem: body.is_system === true,
    linkedProductsCount: Number(body.linked_products_count ?? 0),
    sampleProducts,
    availableMergeTargets,
  };
}

export async function deleteMartBadge(
  id: string,
  payload?: BadgeDeleteRequest,
): Promise<BadgeDeleteResult> {
  const init: RequestInit = payload
    ? json("DELETE", {
        mode: payload.mode,
        ...(payload.targetBadgeId ? { target_badge_id: payload.targetBadgeId } : {}),
      })
    : { method: "DELETE" };
  const response = await call(
    `${BASE}/${encodeURIComponent(id)}`,
    init,
    "The badge could not be deleted.",
  );
  if (response.status === 204) {
    return {
      message: "Badge deleted",
      deletedBadgeId: id,
      deletedBadgeName: "",
      mode: payload?.mode ?? "unlink",
      affectedProductsCount: 0,
      targetBadgeId: payload?.targetBadgeId ?? null,
    };
  }
  const body = (await response.json()) as Record<string, unknown>;
  return {
    message: String(body.message ?? "Badge deleted"),
    deletedBadgeId: String(body.deleted_badge_id ?? id),
    deletedBadgeName: String(body.deleted_badge_name ?? ""),
    mode: body.mode === "merge" ? "merge" : "unlink",
    affectedProductsCount: Number(body.affected_products_count ?? 0),
    targetBadgeId: typeof body.target_badge_id === "string" ? body.target_badge_id : null,
  };
}
