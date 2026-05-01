"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();

  const updates: Record<string, string> = {};

  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const city = formData.get("city") as string;

  if (displayName?.trim()) updates.display_name = displayName.trim();
  updates.bio = bio?.trim() ?? "";
  if (location?.trim()) updates.location = location.trim();
  updates.city = city ?? "";

  const { error } = await (supabase.from("profiles") as any)
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}

export async function uploadAvatar(file: File): Promise<{ error?: string; url?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  // Save avatar URL to profile
  await (supabase.from("profiles") as any)
    .update({ avatar_url: data.publicUrl })
    .eq("id", user.id);

  revalidatePath("/profile");
  return { url: data.publicUrl };
}
