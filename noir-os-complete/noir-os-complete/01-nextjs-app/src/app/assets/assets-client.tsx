"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Trash2, Play, FileText, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createAsset, deleteAsset } from "./actions";

export type AssetDTO = {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  path: string;
  size: number;
  uploaderName: string | null;
};

const BUCKET = "assets";
const FILTERS = ["All", "Image", "Video", "Document"];

function kindFromMime(mime: string) {
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  return "Document";
}
function fmtSize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1000) return `${Math.round(n / 1000)} KB`;
  return `${n} B`;
}
const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_");

export function AssetsClient({ initial, workspaceId }: { initial: AssetDTO[]; workspaceId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState<AssetDTO[]>(initial);
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlFor = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const shown = assets.filter((a) => filter === "All" || a.kind === filter);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const path = `${workspaceId}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) {
          setError(`Upload failed: ${upErr.message}. Create a public "assets" bucket in Supabase Storage (see README).`);
          continue;
        }
        const kind = kindFromMime(file.type);
        const res = await createAsset({ name: file.name, kind, mimeType: file.type || "application/octet-stream", path, size: file.size });
        if (res?.ok) {
          setAssets((a) => [
            { id: res.id, name: file.name, kind, mimeType: file.type, path, size: file.size, uploaderName: "You" },
            ...a,
          ]);
        }
      }
    } catch {
      setError("Something went wrong during upload.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(asset: AssetDTO) {
    setAssets((a) => a.filter((x) => x.id !== asset.id));
    try {
      await deleteAsset({ id: asset.id });
    } catch {
      /* server revalidation reconciles on next load */
    }
  }

  return (
    <div className="px-6 py-5 md:px-[26px]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-[9px] border px-3 py-2 text-[12px] font-semibold transition " +
              (filter === f
                ? "border-[var(--afa-accent)] bg-[var(--afa-accent-soft)] text-[var(--afa-accent-ink)]"
                : "border-[var(--afa-line)] bg-[var(--afa-surface)] text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]")
            }
          >
            {f}
          </button>
        ))}
        <button
          className="ml-auto inline-flex items-center gap-2 rounded-[9px] bg-[var(--afa-accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-60"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {error && <div className="mb-4 rounded-[10px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}

      {shown.length === 0 ? (
        <div className="afa-panel flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--afa-surface-3)] text-[var(--afa-ink-4)]"><ImageIcon size={22} /></div>
          <div className="text-[13px] text-[var(--afa-ink-3)]">No assets yet. Upload images, video, or documents.</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((a) => (
            <div key={a.id} className="afa-panel group overflow-hidden">
              <div className="relative h-[120px] bg-[var(--afa-surface-3)]">
                {a.kind === "Image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlFor(a.path)} alt={a.name} className="h-full w-full object-cover" />
                ) : a.kind === "Video" ? (
                  <div className="grid h-full w-full place-items-center text-[var(--afa-ink-3)]"><Play size={26} /></div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-[var(--afa-ink-3)]"><FileText size={26} /></div>
                )}
                <button
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-[var(--afa-ink-2)] opacity-0 backdrop-blur transition hover:text-[var(--afa-bad)] group-hover:opacity-100"
                  onClick={() => remove(a)}
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold backdrop-blur">{a.kind}</span>
              </div>
              <div className="p-3">
                <div className="truncate text-[12.5px] font-semibold" title={a.name}>{a.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="afa-meta">{fmtSize(a.size)}</span>
                  {a.uploaderName && <span className="afa-meta">{a.uploaderName}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--afa-ink-3)]">
        <Sparkles size={11} /> Files upload to your Supabase Storage <code className="mono">assets</code> bucket; metadata is scoped to your workspace.
      </div>
    </div>
  );
}
