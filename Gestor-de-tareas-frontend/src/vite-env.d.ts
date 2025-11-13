/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Declara tu variable de entorno del API
  readonly VITE_API_URL: string
  // Si tienes otras variables, van aquí
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}