import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site 100% estático: gera a pasta `out/` com HTML, CSS e JS.
  // Funciona sem servidor e sem internet (requisito da feira) e não expõe segredos.
  output: "export",

  // A otimização de imagens do Next depende de servidor; no export estático
  // as imagens são servidas como estão.
  images: {
    unoptimized: true,
  },

  // Tailwind CSS v4 processado pelo Turbopack (configuração gerada pelo create-next-app).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
