"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Region = { id: number; name: string };

export default function Home() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name")
      .order("id")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRegions(data ?? []);
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Danh sách khu vực</h1>
      {error && <p className="text-red-600">Lỗi: {error}</p>}
      <ul className="list-disc pl-6">
        {regions.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </main>
  );
}