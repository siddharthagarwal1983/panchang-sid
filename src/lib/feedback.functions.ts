import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  category: z.enum(["general", "bug", "suggestion", "festival", "other"]),
  message: z.string().min(1).max(5000),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .validator({ adapter: "zod" }, (data) => feedbackSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("feedback").insert({
      name: data.name?.trim() || null,
      email: data.email?.trim() || null,
      category: data.category,
      message: data.message.trim(),
    });

    if (error) {
      console.error("[feedback] insert failed", error);
      throw new Error("Could not send feedback. Please try again later.");
    }

    return { ok: true };
  });
