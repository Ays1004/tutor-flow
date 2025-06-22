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
        <div className="max-w-xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="space-y-4">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarUrl || "/public/avatar.png"} />
                        <AvatarFallback>
                            {email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <Input value={email} disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Username
                        </label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Bio
                        </label>
                        <Input
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Short bio"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Avatar URL
                        </label>
                        <Input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Avatar image URL"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Occupation
                        </label>
                        <Input
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            placeholder="What do you do?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Date of Birth
                        </label>
                        <Input
                            type="date"
                            value={dob ? dob.slice(0, 10) : ""}
                            onChange={(e) => setDob(e.target.value)}
                            placeholder="YYYY-MM-DD"
                        />
                    </div>
                    <Button onClick={handleUpdate}>Update Profile</Button>
                    <Button className="bg-red-600 mx-2" onClick={handleDelete}>
                        Delete Account
                    </Button>
                </div>
            )}
        </div>
    );
}
