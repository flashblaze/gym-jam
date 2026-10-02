import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Regenerate icons with `vp run generate-pwa-assets` after changing public/favicon.svg.
const BACKGROUND = "#0a0a0a";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BACKGROUND } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: BACKGROUND } },
  },
  images: ["public/favicon.svg"],
});
