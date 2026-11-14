"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Region = { id: number; name: string };

export default function PostPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [gender, setGender] = useState("male");
    const [age, setAge] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        supabase
            .from("regions")
            .select("id, name")
            .order("id")
            .then(({ data }) => setRegions(data ?? []));
    }, []);

    function toggleRegion(id: number) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setMessage(null);

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            setMessage("Bạn cần đăng nhập trước.");
            return;
        }
        if (selected.length === 0) {
            setMessage("Hãy chọn ít nhất 1 khu vực.");
            return;
        }

        const { data: post, error } = await supabase
            .from("posts")
            .insert({
                author_id: userData.user.id,
                title,
                description,
                gender,
                age: Number(age),
            })
            .select("id")
            .single();

        if (error || !post) {
            setMessage(error?.message ?? "Không đăng được tin.");
            return;
        }

        const { error: regionError } = await supabase
            .from("post_regions")
            .insert(selected.map((region_id) => ({ post_id: post.id, region_id })));

        if (regionError) {
            setMessage(regionError.message);
            return;
        }

        setMessage("Đăng tin thành công!");
        setTitle("");
        setDescription("");
        setAge("");
        setSelected([]);
    }

    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="mb-4 text-2xl font-bold">Đăng tin</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    className="rounded border p-2"
                    placeholder="Tiêu đề (tối đa 100 ký tự)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                />
                <textarea
                    className="rounded border p-2"
                    placeholder="Chú thích: bạn muốn rủ đi đâu, làm gì?"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                />
                <div className="flex gap-3">
                    <select
                        className="rounded border p-2"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                    </select>
                    <input
                        className="w-28 rounded border p-2"
                        type="number"
                        placeholder="Tuổi"
                        min={16}
                        max={99}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <p className="mb-1 font-semibold">Khu vực (chọn được nhiều):</p>
                    <div className="flex flex-wrap gap-2">
                        {regions.map((r) => (
                            <button
                                type="button"
                                key={r.id}
                                onClick={() => toggleRegion(r.id)}
                                className={`rounded border px-3 py-1 ${selected.includes(r.id) ? "bg-black text-white" : ""
                                    }`}
                            >
                                {r.name}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="rounded bg-black p-2 text-white" type="submit">
                    Đăng tin
                </button>
            </form>
            {message && <p className="mt-3">{message}</p>}
        </main>
    );
}