import {
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ number: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  const { number } = await context.params;
  const { response, rotated } = await proxyCustomerRequest(
    `/api/v1/customer/orders/${encodeURIComponent(number)}/tracking`,
  );
  return forwardCustomerResponse(response, rotated);
}
