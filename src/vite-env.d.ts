/// <reference types="vite/client" />

declare global {
  interface Window {
    clubDesktop?: {
      platform: NodeJS.Platform;
    };
  }
}

export {};
