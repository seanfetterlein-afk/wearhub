"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export type CreateListingState = {
  error?: string;
  success?: boolean;
  productId?: string;
};

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const user = await getUser();
  if (!user) return { error: "Du skal være logget ind for at sælge." };

  const price = parseInt(formData.get("price") as string, 10);
  if (isNaN(price) || price <= 0) return { error: "Ugyldig pris." };

  const supabase = await createClient();

  const { data: product, error } = await (supabase
    .from("products") as any)
    .insert({
      seller_id:             user.id,
      title:                 formData.get("title") as string,
      description:           formData.get("description") as string || null,
      brand:                 formData.get("brand") as string,
      category:              formData.get("category") as string,
      size:                  formData.get("size") as string,
      condition:             formData.get("condition") as "NY" | "SOM NY" | "GOD" | "BRUGT",
      price,
      original_retail_price: formData.get("originalRetailPrice")
        ? parseInt(formData.get("originalRetailPrice") as string, 10)
        : null,
      status: formData.get("status") === "draft" ? "draft" : "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/shop");
  revalidatePath("/dashboard");

  return { success: true, productId: product.id };
}

export async function deleteListing(productId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const { error } = await (supabase
    .from("products") as any)
    .update({ status: "removed" })
    .eq("id", productId)
    .eq("seller_id", user.id); // RLS double-check

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/shop");
  return {};
}

export async function incrementViews(productId: string) {
  const supabase = await createClient();
  await (supabase as any).rpc("increment_product_views", { product_id: productId });
}

/** Upload a product image to Supabase Storage and record it in product_images. */
export async function uploadProductImage(
  productId: string,
  file: File,
  position: number,
): Promise<{ error?: string; path?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `${user.id}/${productId}/${position}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  await (supabase.from("product_images") as any).insert({
    product_id: productId,
    storage_path: path,
    position,
  });

  return { path };
}
