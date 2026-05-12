"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { adminLoginSchema } from "@/lib/schemas";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type FormValues = z.input<typeof adminLoginSchema>;

export function AdminLoginForm({
  initialMessage = "",
  signOutOnMount = false,
}: {
  initialMessage?: string;
  signOutOnMount?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const form = useForm<FormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    if (!signOutOnMount || !supabase) {
      return;
    }

    void supabase.auth.signOut();
  }, [signOutOnMount]);

  async function onSubmit(values: FormValues) {
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase authentication is not configured yet.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-8 shadow-soft"
    >
      <FormInput
        label="Email"
        type="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <FormInput
        label="Password"
        type="password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
      {message ? <p className="text-sm text-rose-600">{message}</p> : null}
    </form>
  );
}
