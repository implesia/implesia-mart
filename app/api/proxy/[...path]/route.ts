import { proxyAdmin } from "@/lib/auth/bff";

type ProxyContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: ProxyContext) {
  const { path } = await context.params;
  return proxyAdmin(request, path.join("/"));
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
