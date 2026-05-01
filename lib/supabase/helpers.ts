/** True when Supabase env vars are present. Used to gracefully fall back to dummy data. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co",
  );
}

/** Build a public Supabase Storage URL from a storage path. */
export function storageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

/** WearHub takes 6% commission. */
export function calculatePayout(price: number): number {
  return Math.round(price * 0.94);
}
