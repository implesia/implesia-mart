export type TokenPair = { access: string; refresh: string };

type RefreshCaller = (
  url: string,
  init: { method: "POST"; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/** Exchange one refresh token. A missing token or a failed call is not a session. */
export async function exchangeRefreshToken(
  refreshToken: string,
  post: RefreshCaller,
  apiBase: string,
): Promise<TokenPair | null> {
  try {
    const response = await post(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!body.access_token || !body.refresh_token) return null;
    return { access: body.access_token, refresh: body.refresh_token };
  } catch {
    return null;
  }
}

/** One in-flight refresh per token, so parallel 401s cannot rotate the family twice. */
export function shareRefresh<T>(
  jobs: Map<string, Promise<T>>,
  token: string,
  run: () => Promise<T>,
) {
  const existing = jobs.get(token);
  if (existing) return existing;
  const job = run().finally(() => {
    jobs.delete(token);
  });
  jobs.set(token, job);
  return job;
}
