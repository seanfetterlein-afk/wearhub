"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="w-full pt-6 pb-3 text-center">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-4 mb-4">
        <div className="flex items-center gap-2 border border-black/20 bg-white px-3 h-10">
          <Search size={14} className="text-[#AAAAAA] shrink-0" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Søg efter mærke, produkt..."
            className="flex-1 text-sm bg-transparent outline-none text-black placeholder:text-[#AAAAAA]"
          />
        </div>
      </form>

      {/* Logo */}
      <Link href="/" className="inline-block mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Nord Studios" className="w-64 h-auto mx-auto" />
      </Link>
    </header>
  );
}
