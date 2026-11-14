"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Post = {
    id: string;
    author_id: string;
    title: string;
    description: string | null;
    gender: string | null;
    age: number | null;
    profiles: { display_name: string } | null;
    post_regions: { regions: { name: string } | null }[];
};

type Comment = {
    id: string;
    content: string;
    created_at: string;
    profiles: { display_name: string } | null;
};

export default function PostDetail() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [following, setFollowing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const loadComments = useCallback(async () => {
        const { data } = await supabase
            .from("comments")
            .select("id, content, created_at, profiles(display_name)")
            .eq("post_id", id)
            .order("created_at", { ascending: true });
        setComments((data ?? []) as unknown as Comment[]);
    }, [id]);

    useEffect(() => {
        supabase
            .from("posts")
            .select(
                "id, author_id, title, description, gender, age, profiles(display_name), post_regions(regions(name))"
            )
            .eq("id", id)
            .single()
            .then(({ data, error }) => {
                if (error) setMessage(error.message);
                else setPost(data as unknown as Post);
            });

        loadComments();

        const channel = supabase
            .channel(`comments-${id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${id}` },
                () => loadComments()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, loadComments]);

    useEffect(() => {
        if (!post) return;
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) return;
            setUserId(data.user.id);
            supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", data.user.id)
                .eq("following_id", post.author_id)
                .maybeSingle()
                .then(({ data: row }) => setFollowing(!!row));
        });
    }, [post]);

    async function toggleFollow() {
        if (!userId || !post) {
            setMessage("Bạn cần đăng nhập để quan tâm.");
            return;
        }
        if (following) {
            await supabase
                .from("follows")
                .delete()
                .eq("follower_id", userId)
                .eq("following_id", post.author_id);
            setFollowing(false);
        } else {
            const { error } = await supabase
                .from("follows")
                .insert({ follower_id: userId, following_id: post.author_id });
            if (error) setMessage(error.message);
            else setFollowing(true);
        }
    }

    async function sendComment(e: React.SyntheticEvent) {
        e.preventDefault();
        setMessage(null);
        if (!userId) {
            setMessage("Bạn cần đăng nhập để bình luận.");
            return;
        }
        const { error } = await supabase
            .from("comments")
            .insert({ post_id: id, author_id: userId, content });
        if (error) setMessage(error.message);
        else setContent("");
    }

    if (!post) return <main className="p-8">{message ?? "Đang tải..."}</main>;

    return (
        <main className="mx-auto max-w-2xl p-8">
            <Link href="/" className="text-sm underline">
                ← Về bảng tin
            </Link>

            <article className="mt-4 rounded border p-4">
                <h1 className="text-xl font-bold">{post.title}</h1>
                <p className="text-sm text-gray-600">
                    {post.profiles?.display_name} · {post.gender === "male" ? "Nam" : "Nữ"} ·{" "}
                    {post.age} tuổi · {post.post_regions.map((pr) => pr.regions?.name).join(", ")}
                </p>
                {post.description && <p className="mt-2">{post.description}</p>}
                {userId !== post.author_id && (
                    <button
                        onClick={toggleFollow}
                        className="mt-3 rounded border px-3 py-1 text-sm"
                    >
                        {following ? "Bỏ quan tâm" : "Quan tâm người này"}
                    </button>
                )}
            </article>

            <h2 className="mt-6 mb-2 font-semibold">Bình luận ({comments.length})</h2>
            <div className="flex flex-col gap-2">
                {comments.map((c) => (
                    <div key={c.id} className="rounded border p-2">
                        <p className="text-sm font-semibold">{c.profiles?.display_name}</p>
                        <p>{c.content}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={sendComment} className="mt-4 flex gap-2">
                <input
                    className="flex-1 rounded border p-2"
                    placeholder="Viết bình luận..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    maxLength={1000}
                />
                <button className="rounded bg-black px-4 text-white" type="submit">
                    Gửi
                </button>
            </form>
            {message && <p className="mt-3 text-red-600">{message}</p>}
        </main>
    );
}