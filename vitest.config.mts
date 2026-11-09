import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // A lógica é TypeScript puro e os testes de integração usam a renderização do React no
    // servidor (react-dom/server): nenhum navegador simulado é necessário.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
