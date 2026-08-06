import { invoke } from "@/lib/electron";

export const sendMessageToBackend = (method: string, parameters?: any) => {
  invoke({ channel: `segra:${method}`, payload: parameters }).catch((err) => {
    console.error(`[Segra IPC] ${method} failed:`, err);
  });
};

export const sendSyncToBackend = (method: string, parameters?: any): any => {
  return invoke({ channel: `segra:${method}`, payload: parameters });
};
