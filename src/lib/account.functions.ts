import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in caller's account and data.
 * The caller's identity comes only from the verified bearer token, so a user
 * can never delete anyone but themselves.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const steps = [
      supabaseAdmin.from("user_settings").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      // Keep feedback text but detach it from the account.
      supabaseAdmin.from("feedback").update({ user_id: null }).eq("user_id", userId),
    ];
    for (const step of steps) {
      const { error } = await step;
      if (error) {
        console.error("deleteMyAccount row cleanup failed", error);
        throw new Error("Could not delete your data. Please try again.");
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("deleteMyAccount auth delete failed", error);
      throw new Error("Could not delete your account. Please try again.");
    }
    return { ok: true };
  });
