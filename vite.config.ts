import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const LOCAL_API = "http://127.0.0.1:8001";
const PRODUCTION_API = "https://mart-api.implesia.com";

export default defineConfig(({ mode }) => {
  // Browser bundles cannot read Wrangler vars. Inline the public API URL at
  // build time so admin login and other client fetches hit the live API.
  const apiUrl =
    process.env.NEXT_PUBLIC_MART_API_URL ??
    (mode === "production" ? PRODUCTION_API : LOCAL_API);

  return {
    define: {
      "process.env.NEXT_PUBLIC_MART_API_URL": JSON.stringify(apiUrl),
    },
    plugins: [
      vinext({
        cache: {
          data: kvDataAdapter(),
        },
        images: { optimizer: imagesOptimizer() },
      }),
      cloudflare({
        viteEnvironment: {
          name: "rsc",
          childEnvironments: ["ssr"],
        },
      }),
    ],
  };
});
