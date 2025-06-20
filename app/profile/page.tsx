// app/profile/page.tsx
'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        toast.error("Failed to fetch user info");
        return;
      }

      if (user) {
        setUserEmail(user.email ?? "");
        // optionally fetch username from a profile table
      }

      setLoading(false);
    };

    getUserProfile();
  }, []);

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src="/default-avatar.png" />
            <AvatarFallback>{userEmail?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={userEmail ?? ""} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <Button onClick={() => toast.success("Feature coming soon!")}>
            Update Profile
          </Button>
        </div>
      )}
    </div>
  );
}
