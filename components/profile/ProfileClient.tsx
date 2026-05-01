"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, Calendar, Star, Pencil, X, Camera } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { ConditionBadge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/home/ProductCard";
import { formatPrice } from "@/lib/utils";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import { deleteListing } from "@/lib/actions/products";
import type { Product, User, Review, SoldListing } from "@/types";

const DANISH_CITIES = [
  "Aalborg","Aarhus","Albertslund","Allerød","Assens","Ballerup","Billund",
  "Birkerød","Brøndby","Brønderslev","Dragør","Esbjerg","Faaborg","Farum",
  "Fredericia","Frederiksberg","Frederikshavn","Frederikssund","Frederiksværk",
  "Gentofte","Gladsaxe","Glostrup","Greve","Gribskov","Grindsted","Haderslev",
  "Helsingør","Herlev","Herning","Hillerød","Hjørring","Holbæk","Holstebro",
  "Horsens","Hvidovre","Høje-Taastrup","Hørsholm","Ikast","Ishøj","Kalundborg",
  "Kerteminde","Kolding","København","Køge","Lejre","Lemvig","Lyngby","Løgstør",
  "Mariagerfjord","Middelfart","Morsø","Næstved","Norddjurs","Nordfyns","Nyborg",
  "Nykøbing F","Nykøbing M","Odense","Odsherred","Randers","Rebild","Ringkøbing",
  "Ringsted","Roskilde","Rudersdal","Rødovre","Silkeborg","Skanderborg","Skive",
  "Slagelse","Solrød","Sorø","Stevns","Struer","Svendborg","Syddjurs","Sønderborg",
  "Thisted","Tårnby","Vallensbæk","Vejle","Viborg","Vordingborg","Ærø","Aabenraa",
].sort((a, b) => a.localeCompare(b, "da"));

interface Props {
  user: User;
  listings: Product[];
  soldItems: SoldListing[];
  reviews: Review[];
}

export function ProfileClient({ user: initialUser, listings: initialListings, soldItems, reviews }: Props) {
  const [tab, setTab] = useState("listings");
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [listings, setListings] = useState(initialListings);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDelete = (productId: string) => {
    if (confirmDeleteId !== productId) {
      setConfirmDeleteId(productId);
      return;
    }
    setDeletingId(productId);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await deleteListing(productId);
      if (!result.error) {
        setListings((prev) => prev.filter((l) => l.id !== productId));
      }
      setDeletingId(null);
    });
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (editing) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [editing]);

  const tabs = [
    { key: "listings", label: "Listings",    count: listings.length },
    { key: "sold",     label: "Solgt",       count: soldItems.length },
    { key: "reviews",  label: "Anmeldelser", count: reviews.length },
  ];

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : user.rating;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      // Upload avatar if changed
      if (avatarFile) {
        const { error: avatarError, url } = await uploadAvatar(avatarFile);
        if (avatarError) { setError(avatarError); return; }
        if (url) setAvatarPreview(url);
      }

      const { error: profileError } = await updateProfile(formData);
      if (profileError) { setError(profileError); return; }

      // Optimistically update displayed user
      setUser(u => ({
        ...u,
        displayName: (formData.get("displayName") as string) || u.displayName,
        bio:         (formData.get("bio") as string) || undefined,
        location:    (formData.get("location") as string) || u.location,
        city:        (formData.get("city") as string) || u.city,
        avatarUrl:   avatarPreview ?? u.avatarUrl,
      }));
      setEditing(false);
    });
  };

  return (
    <>
      {/* Profile card */}
      <div className="border border-brown/20 bg-cream p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt={user.displayName}
                className="w-20 h-20 rounded-full object-cover border border-brown/20"
              />
            ) : (
              <Avatar name={user.displayName} size="lg" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="font-display font-semibold text-brown text-2xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                {user.displayName}
              </h1>
              {user.isVerified && (
                <span className="flex items-center gap-1 font-mono text-2xs tracking-wider text-brown uppercase border border-brown px-2 py-0.5">
                  <ShieldCheck size={10} /> VERIFICERET
                </span>
              )}
            </div>
            <p className="font-mono text-2xs tracking-widest text-ink-dim mt-0.5">@{user.username}</p>
            {user.bio && (
              <p className="text-ink-mid text-sm mt-3 max-w-lg leading-relaxed">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-ink-dim">
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider">
                <MapPin size={11} /> {user.location}{user.city ? `, ${user.city}` : ""}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider">
                <Calendar size={11} /> Siden{" "}
                {new Date(user.memberSince).toLocaleDateString("da-DK", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 border border-brown px-4 py-2 font-mono text-[11px] tracking-widest text-brown uppercase hover:bg-brown hover:text-cream transition-colors"
            >
              <Pencil size={11} /> REDIGER PROFIL
            </button>
            <Link
              href="/sell"
              className="border border-brown/20 px-4 py-2 font-mono text-[11px] tracking-widest text-ink-mid uppercase hover:border-brown hover:text-brown transition-colors text-center"
            >
              + NY ANNONCE
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-brown/20 mt-6 divide-x divide-brown/20">
          {[
            { val: user.totalSales,       lbl: "Solgte items" },
            { val: listings.length,        lbl: "Aktive listings" },
            { val: avgRating.toFixed(1),   lbl: "Rating" },
            { val: `${user.responseRate}%`, lbl: "Svarprocent" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="py-4 px-5 text-center">
              <div className="font-display font-semibold text-brown text-2xl" style={{ letterSpacing: "-0.02em" }}>
                {val}
              </div>
              <div className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mt-1">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="w-full sm:max-w-md bg-white border border-brown/20 flex flex-col max-h-[92vh]">
            {/* Header — always visible */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brown/10 shrink-0">
              <h2 className="font-display font-semibold text-brown text-xl" style={{ letterSpacing: "-0.02em" }}>
                Rediger profil
              </h2>
              <button onClick={() => setEditing(false)} className="text-ink-dim hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable fields */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative w-24 h-24 cursor-pointer group"
                    onClick={() => fileRef.current?.click()}
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border border-brown/20"
                      />
                    ) : (
                      <Avatar name={user.displayName} size="lg" />
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="font-mono text-[10px] tracking-wider text-ink-dim uppercase underline underline-offset-2"
                  >
                    Skift profilbillede
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <Field label="Navn">
                  <input name="displayName" type="text" defaultValue={user.displayName} placeholder="Dit navn" className={inputCls} />
                </Field>

                <Field label="Beskrivelse">
                  <textarea name="bio" defaultValue={user.bio ?? ""} placeholder="Fortæl lidt om dig selv..." rows={4} className={`${inputCls} resize-none py-2.5`} />
                </Field>

                <Field label="Lokation">
                  <input name="location" type="text" defaultValue={user.location} placeholder="f.eks. København" className={inputCls} />
                </Field>

                <Field label="By">
                  <select
                    name="city"
                    defaultValue={user.city ?? ""}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="">Vælg din by</option>
                    {DANISH_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </Field>

                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>

              {/* Sticky save button — always visible at bottom */}
              <div className="shrink-0 px-6 py-4 border-t border-brown/10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-brown/20 py-3 font-mono text-[11px] tracking-widest text-ink-mid uppercase hover:border-brown transition-colors"
                >
                  ANNULLER
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-black text-white py-3 font-mono text-[11px] tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                  {isPending ? "GEMMER..." : "GEM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-8" />

      {/* Listings */}
      {tab === "listings" && (
        listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {listings.map((product, i) => (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} priority={i < 4} />
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  onBlur={() => {
                    if (confirmDeleteId === product.id) setConfirmDeleteId(null);
                  }}
                  className={`w-full py-1.5 font-mono text-[9px] tracking-widest uppercase border transition-colors disabled:opacity-40 ${
                    confirmDeleteId === product.id
                      ? "border-red-400 text-red-600 bg-red-50"
                      : "border-black/15 text-[#AAAAAA] hover:border-black/40 hover:text-black"
                  }`}
                >
                  {deletingId === product.id
                    ? "SLETTER..."
                    : confirmDeleteId === product.id
                    ? "BEKRÆFT SLET"
                    : "SLET"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">INGEN LISTINGS</p>
            <Link href="/sell" className="mt-4 inline-block font-mono text-[11px] tracking-wider text-brown uppercase underline underline-offset-2">
              + OPRET DIN FØRSTE ANNONCE
            </Link>
          </div>
        )
      )}

      {/* Sold */}
      {tab === "sold" && (
        soldItems.length > 0 ? (
          <div className="flex flex-col divide-y divide-brown/10">
            {soldItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="w-16 h-16 bg-cream-deep border border-brown/10 shrink-0">
                  {item.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase">{item.product.brand}</p>
                  <p className="font-body text-sm font-medium text-ink truncate">{item.product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ConditionBadge condition={item.product.condition} />
                    <span className="font-mono text-[10px] text-ink-dim">Solgt til @{item.buyerUsername}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-semibold text-brown" style={{ fontSize: 17, letterSpacing: "-0.01em" }}>
                    {formatPrice(item.product.price)}
                  </div>
                  <div className="font-mono text-[9px] text-ink-dim tracking-wider">Udbetalt: {formatPrice(item.payout)}</div>
                  <div className="font-mono text-[9px] text-ink-dim mt-0.5">{new Date(item.soldAt).toLocaleDateString("da-DK")}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase">INGEN SALG ENDNU</p>
          </div>
        )
      )}

      {/* Reviews */}
      {tab === "reviews" && (
        reviews.length > 0 ? (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-brown/15 p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={review.authorUsername} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-body font-semibold text-ink text-sm">@{review.authorUsername}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < review.rating ? "text-brown fill-brown" : "text-brown/20"} />
                        ))}
                      </div>
                      <span className="font-mono text-[9px] text-ink-dim tracking-wider">
                        {new Date(review.createdAt).toLocaleDateString("da-DK")}
                      </span>
                    </div>
                    <p className="font-mono text-[9px] tracking-wider text-ink-dim uppercase mb-2">{review.productTitle}</p>
                    <p className="text-ink-mid text-sm leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase">INGEN ANMELDELSER ENDNU</p>
          </div>
        )
      )}
    </>
  );
}

const inputCls =
  "w-full h-11 px-3.5 border border-brown/20 bg-transparent font-body text-sm text-ink placeholder:text-ink-dim outline-none focus:border-brown/50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-widest text-ink-dim uppercase">{label}</label>
      {children}
    </div>
  );
}
