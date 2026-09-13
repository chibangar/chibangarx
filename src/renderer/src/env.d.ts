/// <reference types="vite/client" />

interface Window {
  electron: import("../../preload/index").ElectronBridge
  api: import("../../preload/index").AppBridge
}
