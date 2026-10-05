import { WHATSAPP_HREF, contactCopy } from "@/app/(client)/_data/contact/contact";

export const FALLBACK_CONTACT_DETAILS = {
  isActive: true,
  title: contactCopy.direct.title,
  subtitle: contactCopy.direct.subtitle,
  badge: contactCopy.direct.badge,
  channels: contactCopy.direct.channels.map((item, index) => ({
    id: `fallback-${index + 1}`,
    icon: item.icon,
    title: item.title,
    value: item.value,
    href: item.icon === "chat" ? WHATSAPP_HREF : item.href,
    isActive: true,
  })),
  social: contactCopy.direct.social.map((item) => ({
    platform: item.platform,
    label: item.label,
    href: item.href,
    isActive: true,
  })),
};
