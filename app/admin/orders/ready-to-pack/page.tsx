import type { Metadata } from "next";

import { ReadyToPack } from "../_components/ready-to-pack";

export const metadata: Metadata = {
  title: "Ready to pack",
  robots: { index: false, follow: false },
};

export default function AdminReadyToPackPage() {
  return <ReadyToPack />;
}
