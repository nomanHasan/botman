// src/services/toastService.js
// Global toast notification service using event emitter pattern

const listeners = new Set();

export function showToast(message) {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
