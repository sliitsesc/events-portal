"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const completeProfileSchema = z.object({
  student_id: z.string().trim().min(8, "Please enter a valid Student ID."),
});

export function CompleteProfileForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [displayName, setDisplayName] = useState("Student");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, student_id, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        router.replace("/admin/events");
        return;
      }

      if (profile?.student_id?.trim()) {
        router.replace("/events");
        return;
      }

      setDisplayName(
        profile?.full_name?.trim() ||
          user.user_metadata?.full_name ||
          user.email ||
          "Student",
      );
      setStudentId(profile?.student_id ?? "");
      setIsFetching(false);
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = completeProfileSchema.safeParse({ student_id: studentId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid profile details.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const payload = {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (typeof user.user_metadata?.full_name === "string" &&
            user.user_metadata.full_name) ||
          null,
        student_id: parsed.data.student_id,
      };

      const { data, error: upsertError } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("is_admin")
        .single();

      if (upsertError) throw upsertError;

      router.replace(data?.is_admin ? "/admin/events" : "/events");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : "An error occurred";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("duplicate key")) {
        setError("This Student ID is already in use. Please contact support.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Loading your account details...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome, {displayName}. Enter your SLIIT Student ID to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="IT22XXXXXX"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save and Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
