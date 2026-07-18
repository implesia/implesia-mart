import emailjs from "@emailjs/browser";

import {
  buildOrderTemplateParams,
  type PlaceOrderPayload,
} from "./build-template-params";
import { emailJsConfig } from "./config";

export async function sendOrderEmail(payload: PlaceOrderPayload) {
  const templateParams = buildOrderTemplateParams(payload);

  return emailjs.send(
    emailJsConfig.serviceId,
    emailJsConfig.templateId,
    templateParams,
    { publicKey: emailJsConfig.publicKey },
  );
}
