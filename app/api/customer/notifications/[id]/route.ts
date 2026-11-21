import {
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  const { id } = await context.params;
  const { response, rotated } = await proxyCustomerRequest(
    `/api/v1/customer/notifications/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return forwardCustomerResponse(response, rotated);
}
