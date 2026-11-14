"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setMessage(null);

        if (mode === "signup") {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { display_name: name } },
            });
            setMessage(error ? error.message : "Đăng ký thành công!");
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            setMessage(error ? error.message : "Đăng nhập thành công!");
        }
    }

    return (
        <main className="mx-auto max-w-sm p-8">
            <h1 className="mb-4 text-2xl font-bold">
                {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {mode === "signup" && (
                    <input
                        className="rounded border p-2"
                        placeholder="Tên hiển thị"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                    />
                )}
                <input
                    className="rounded border p-2"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="rounded border p-2"
                    type="password"
                    placeholder="Mật khẩu (từ 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <button className="rounded bg-black p-2 text-white" type="submit">
                    {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
            </form>
            {message && <p className="mt-3">{message}</p>}
            <button
                className="mt-4 text-sm underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
                {mode === "login"
                    ? "Chưa có tài khoản? Đăng ký"
                    : "Đã có tài khoản? Đăng nhập"}
            </button>
        </main>
    );
}