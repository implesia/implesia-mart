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

  const { response, rotated } = await proxyCustomerRequest(
    "/api/v1/customer/purchased-products",
  );
  return forwardCustomerResponse(response, rotated);
}
