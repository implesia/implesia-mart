import {
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  const { search } = new URL(request.url);
  const { response, rotated } = await proxyCustomerRequest(
    `/api/v1/customer/notifications${search}`,
  );
  return forwardCustomerResponse(response, rotated);
}
