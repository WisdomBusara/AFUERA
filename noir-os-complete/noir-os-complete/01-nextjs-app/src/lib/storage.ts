import path from "path";

// Asset files live on local disk, namespaced by workspace: <ASSETS_DIR>/<workspaceId>/<file>.
export const ASSETS_DIR = path.resolve(process.env.ASSETS_DIR ?? "./uploads");

/** Absolute path for a stored asset; throws if `rel` would escape ASSETS_DIR. */
export function resolveAssetPath(rel: string) {
  const full = path.resolve(ASSETS_DIR, rel);
  if (!full.startsWith(ASSETS_DIR + path.sep)) throw new Error("Invalid path");
  return full;
}
