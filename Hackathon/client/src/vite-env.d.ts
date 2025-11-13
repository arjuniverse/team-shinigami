/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ISSUER_API_URL: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_LIGHTHOUSE_API_KEY: string;
  readonly VITE_DOCUMENT_HASH_CONTRACT: string;
  readonly VITE_USE_MOCK_STORAGE: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
