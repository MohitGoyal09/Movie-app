declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_OMDB_API_KEY: string;
    }
  }
}

export {};