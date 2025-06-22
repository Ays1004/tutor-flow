"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import DarkModeToggle from "../DarkModeToggle/DarkModeToggle";
import { SignupModal } from "../SignUpModal/SignUpModal";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>("/avatar.png");
    const [loading, setLoading] = useState(true);
    const [loginOpen, setLoginOpen] = useState(false);
    const [signupOpen, setSignupOpen] = useState(false);
    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (user) {
                setUserEmail(user.email ?? null);
                // Fetch avatar from profiles table
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("avatar_url")
                    .eq("id", user.id)
                    .single();
                if (profile && profile.avatar_url) {
                    setAvatarUrl(profile.avatar_url);
                } else {
                    setAvatarUrl("/avatar.png");
                }
            }
            setLoading(false);
        };

        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const initials = userEmail?.[0]?.toUpperCase() || "?";

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-lg px-6 py-3 sticky top-0 z-50 transition-colors">
            <div className="max-w-5xl mx-auto min-h-9 flex justify-between items-center">
                <Link
                    href="/"
                    className="text-xl font-bold text-blue-600 dark:text-blue-400"
                >
                    Tutor-Flow
                </Link>

                <ul className="flex items-center gap-6">
                    <li>
                        <DarkModeToggle />
                    </li>
                    <li>
                        <Link
                            href="/upload"
                            className={`hover:underline ${
                                pathname === "/upload"
                                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                                    : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            Upload
                        </Link>
                    </li>
                    {loading ? (
                        <div className="w-9 h-9"></div>
                    ) : userEmail ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Avatar className="w-9 h-9">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>
                                    My Account
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    router.push('/profile')
                                }}>Profile</DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        router.push('/dashboard')
                                    }}
                                >
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 dark:text-red-400"
                                >
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div>
                            <nav>
        <button onClick={() => setLoginOpen(true)}>Sign In</button>
      </nav>
      <LoginModal
        open={loginOpen}
        setOpen={setLoginOpen}
        switchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
      <SignupModal
        open={signupOpen}
        setOpen={setSignupOpen}
        switchToLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />
                        </div>
                    )}
                </ul>
            </div>
        </nav>
    );
}
