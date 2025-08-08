/// <reference path="../.astro/types.d.ts" />

export {};

declare global {
  interface Window {
    showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  }
}