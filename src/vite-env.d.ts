/// <reference types="vite/client" />

    interface ImportMetaEnv {
      readonly VITE_API_URL: string
      // Agrega aquí cualquier otra variable VITE_ que necesites
    }

    interface ImportMeta {
      readonly env: ImportMetaEnv
    }