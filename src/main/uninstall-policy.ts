export interface CatalogApp {
  id: string
}

/** Maps renderer requests to main-owned catalog entries, never to commands. */
export function resolveInstalledApps<T extends CatalogApp>(catalog: readonly T[], requests: unknown): T[] {
  if (!Array.isArray(requests) || requests.length === 0 || requests.length > 100) {
    throw new Error("Invalid uninstall request")
  }

  const byId = new Map(catalog.map((app) => [app.id, app]))
  const selected = new Set<string>()
  return requests.map((request) => {
    if (
      !request ||
      typeof request !== "object" ||
      Object.keys(request).length !== 1 ||
      typeof (request as { id?: unknown }).id !== "string"
    ) {
      throw new Error("Invalid uninstall request")
    }
    const id = (request as { id: string }).id
    const app = byId.get(id)
    if (!app || selected.has(id)) throw new Error("Invalid uninstall request")
    selected.add(id)
    return app
  })
}
