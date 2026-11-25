import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // "./" faz o site funcionar tanto em usuario.github.io quanto em
  // usuario.github.io/nome-do-repositorio/, sem precisar saber o nome do repo.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": root },
  },
});
