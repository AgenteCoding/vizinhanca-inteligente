import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // A lógica do domínio é TypeScript puro: não precisa de navegador simulado.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
