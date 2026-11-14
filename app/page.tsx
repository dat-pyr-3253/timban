"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Region = { id: number; name: string };

type Post = {
  id: string;
  title: string;
  description: string | null;
  gender: string | null;
  age: number | null;
  created_at: string;
  profiles: { display_name: string } | null;
  post_regions: { region_id: number; regions: { name: string } | null }[];
};

export default function Home() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [regionFilter, setRegionFilter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name")
      .order("id")
      .then(({ data }) => setRegions(data ?? []));

    supabase
      .from("posts")
      .select(
        "id, title, description, gender, age, created_at, profiles(display_name), post_regions(region_id, regions(name))"
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPosts((data ?? []) as unknown as Post[]);
      });
  }, []);

  const shown = regionFilter
    ? posts.filter((p) => p.post_regions.some((pr) => pr.region_id === regionFilter))
    : posts;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bảng tin</h1>
        <div className="flex gap-3 text-sm underline">
          <Link href="/dang-tin">Đăng tin</Link>
          <Link href="/login">Đăng nhập</Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setRegionFilter(null)}
          className={`rounded border px-3 py-1 ${regionFilter === null ? "bg-black text-white" : ""}`}
        >
          Tất cả
        </button>
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => setRegionFilter(r.id)}
            className={`rounded border px-3 py-1 ${regionFilter === r.id ? "bg-black text-white" : ""}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600">Lỗi: {error}</p>}
      {shown.length === 0 && !error && <p>Chưa có tin nào.</p>}

      <div className="flex flex-col gap-3">
        {shown.map((p) => (
          <article key={p.id} className="rounded border p-4">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="text-sm text-gray-600">
              {p.profiles?.display_name} · {p.gender === "male" ? "Nam" : "Nữ"} · {p.age} tuổi ·{" "}
              {p.post_regions.map((pr) => pr.regions?.name).join(", ")}
            </p>
            {p.description && <p className="mt-2">{p.description}</p>}
          </article>
        ))}
      </div>
    </main>
  );
}