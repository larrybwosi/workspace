import { load } from "@tauri-apps/plugin-store";

export async function getSecureStore() {
  return await load("auth.json", { autoSave: true });
}

export async function saveAuthToken(token: string) {
  const store = await getSecureStore();
  await store.set("token", token);
}

export async function getAuthToken() {
  const store = await getSecureStore();
  return await store.get<string>("token");
}

export async function clearAuthToken() {
  const store = await getSecureStore();
  await store.delete("token");
}
