"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react"; // Add this import for icons
import { toast } from "react-hot-toast"; // Changed from sonner to react-hot-toast
import { InputBox } from "@/components/InputBox/InputBox";

interface SignupModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    switchToLogin: () => void;
}

export function SignupModal({
    open,
    setOpen,
    switchToLogin,
}: SignupModalProps) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState(""); // Add this state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!username.trim()) {
            setError("Username is required.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: username,
                },
                // Prevent auto-login after sign up
                emailRedirectTo: undefined, // Remove redirect
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        const userId = data.user?.id;

        // Save in your custom 'profiles' table as well
        if (userId) {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert([
                    {
                        id: userId,
                        username,
                        email,
                    },
                ]);

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }
        }

        toast.success("Sign up successful!");

        setLoading(false);
        setOpen(false);

        setTimeout(() => {
            window.location.href = "/";
        }, 200);
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({ provider: "google" });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        Create your account
                    </DialogTitle>
                    <DialogDescription>
                        Sign up with email and password to get started
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignup}>
                    <div className="grid gap-6 mt-4">
                        <div className="grid gap-3">
                            <Label htmlFor="username">Username</Label>
                            <InputBox
                                id="username"
                                type="text"
                                placeholder="yourusername"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <InputBox
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="password">Password</Label>
                            <InputBox
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="confirm-password">
                                Confirm Password
                            </Label>
                            <InputBox
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <div className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Signing up..." : "Sign Up"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                type="button"
                                onClick={handleGoogle}
                            >
                                Continue with Google
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <a
                            onClick={switchToLogin}
                            className="underline underline-offset-4 cursor-pointer"
                        >
                            Login
                        </a>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
