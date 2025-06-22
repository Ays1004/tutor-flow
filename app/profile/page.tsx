"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable profile fields
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    const [avatarUrl, setAvatarUrl] = useState<string>("/avatar.png");
    const [occupation, setOccupation] = useState<string>("");
    const [dob, setDob] = useState<string>("");

    // Fetch user & profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                toast.error("Failed to fetch user info");
                setLoading(false);
                return;
            }

            if (!user) {
                toast.error("Not logged in");
                setLoading(false);
                return;
            }

            setUserId(user.id);
            setEmail(user.email ?? "");

            // Fetch profile from 'profiles' table
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError) {
                toast.error("Failed to fetch profile");
            } else if (profile) {
                setUsername(profile.username ?? "");
                setBio(profile.bio ?? "");
                setAvatarUrl(profile.avatar_url ?? "/avatar.png");
                setOccupation(profile.occupation ?? "");
                setDob(profile.dob ?? "");
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    // Handle Delete
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );
        if (!confirmed) return;
        try {
            const res = await fetch("/api/delete-user", {
                method: "POST",
                body: JSON.stringify({ userId }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                toast.success("Account deleted successfully.");
                window.location.href = "/";
                // Optionally, redirect or log out the user here
            } else {
                const data = await res.json();
                toast.error(data?.error || "Failed to delete account.");
            }
        } catch {
            toast.error("An error occurred while deleting your account.");
        }
    };
    // Handle update
    const handleUpdate = async () => {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase
            .from("profiles")
            .update({
                username,
                bio,
                avatar_url: avatarUrl,
                occupation,
                dob: dob || null,
            })
            .eq("id", userId);
        setLoading(false);

        if (error) {
            console.error("Supabase update error:", error);
            toast.error("Failed to update profile.");
        } else {
            toast.success("Profile updated!");
        }
    };

    return (
        <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-foreground">
                    Your Profile
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage your account information
                </p>
            </div>

            <div className="bg-card rounded-xl shadow-md p-6 sm:p-8 flex flex-col items-center gap-6 border border-border">
                <Avatar className="w-24 h-24 border-4 border-primary bg-background">
                    <AvatarImage src={avatarUrl || "/avatar.png"} />
                    <AvatarFallback className="bg-muted text-lg">
                        {email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {loading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                ) : (
                    <form
                        className="w-full flex flex-col gap-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdate();
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Email
                                </label>
                                <Input
                                    value={email}
                                    disabled
                                    className="bg-muted/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Username
                                </label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Your name"
                                    className="bg-background"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Short bio"
                                    rows={5}
                                    className="bg-muted/50 border rounded-md w-full p-2 text-foreground resize-none min-h-[100px]  "
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Avatar URL
                                </label>
                                <Input
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="Avatar image URL"
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Occupation
                                </label>
                                <Input
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                    placeholder="What do you do?"
                                    className="bg-background"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                    Date of Birth
                                </label>
                                <Input
                                    type="date"
                                    value={dob ? dob.slice(0, 10) : ""}
                                    onChange={(e) => setDob(e.target.value)}
                                    placeholder="YYYY-MM-DD"
                                    className="bg-background"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                            <Button
                                type="submit"
                                className="w-full sm:w-auto"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Profile"}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                Delete Account
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
