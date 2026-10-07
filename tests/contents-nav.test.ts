import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { privacyContentsNav, shippingContentsNav } from "../lib/mart-api/contents-nav.ts";

const heading = {
  isActive: true,
  icon: "",
  navLabel: "  Sidebar  ",
  heading: "Page heading",
};

describe("contents nav", () => {
  it("uses the sidebar label from an active section and drops a hidden one", () => {
    const links = shippingContentsNav({
      shipping: heading,
      payment: { ...heading, navLabel: "", heading: "Payment heading", icon: "payments" },
      returns: { ...heading, isActive: false, navLabel: "Hidden returns", heading: "Returns" },
      refund: { ...heading, navLabel: "Refund link", heading: "   " },
      support: { isActive: true, icon: "", navLabel: "", title: "Support title" },
    });
    assert.deepEqual(
      links.map((item) => item.label),
      ["Sidebar", "Payment heading", "Support title"],
    );
    assert.equal(links[0]?.icon, "local_shipping");
    assert.equal(links[2]?.id, "support");
  });

  it("builds the privacy sidebar from the same section fields", () => {
    const links = privacyContentsNav({
      introduction: heading,
      collection: null,
      usage: { ...heading, navLabel: "Use", heading: "Usage" },
      sharing: { ...heading, isActive: false, navLabel: "Share", heading: "Sharing" },
      rights: { ...heading, navLabel: "", heading: "Rights heading" },
      support: { isActive: true, icon: "support_agent", navLabel: "Help", title: "Support" },
    });
    assert.deepEqual(
      links.map((item) => [item.id, item.label]),
      [
        ["introduction", "Sidebar"],
        ["usage", "Use"],
        ["rights", "Rights heading"],
        ["support", "Help"],
      ],
    );
  });
});
