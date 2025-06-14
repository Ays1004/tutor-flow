"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginModal } from "../LoginModal/LoginModal";

export default function Navbar() {
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (user) {
                setUserEmail(user.email ?? null);
            }
            setLoading(false);
        };

        getUser();
    }, []);

    const login = async () => {
        await supabase.auth.signInWithOAuth({ provider: "google" });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const initials = userEmail?.[0]?.toUpperCase() || "?";

    return (
        <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto min-h-9 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                    Tutor-Flow
                </Link>

                <ul className="flex items-center gap-6">
                    <li>
                        <Link
                            href="/dashboard"
                            className={`hover:underline ${
                                pathname === "/dashboard"
                                    ? "text-blue-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/upload"
                            className={`hover:underline ${
                                pathname === "/upload"
                                    ? "text-blue-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            Upload
                        </Link>
                    </li>
                    {loading ? (
                        <div className="w-9 h-9">
                        </div>
                    ) : userEmail ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <div className="w-9 h-9 bg-blue-500 text-white rounded-full text-md font-bold flex items-center justify-center">
                                    {initials}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>
                                    My Account
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>
                                    Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600"
                                >
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div>
                            <nav>
                                <button onClick={() => setLoginOpen(true)}>
                                    {" "}
                                    Sign In
                                </button>
                            </nav>
                            <LoginModal
                                open={loginOpen}
                                setOpen={setLoginOpen}
                            />
                        </div>
                    )}
                </ul>
            </div>
        </nav>
    );
}
