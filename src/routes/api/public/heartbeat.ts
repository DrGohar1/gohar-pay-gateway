// Heartbeat: يحدّث devices.is_online + last_seen_at من غير ما يُنشئ raw_message.
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Body = z.object({ device_id: z.string().uuid() });

function sha256(s: string) { return crypto.createHash("sha256").update(s).digest("hex"); }

export const Route = createFileRoute("/api/public/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-device-token");
        if (!token) return new Response("missing device token", { status: 401 });
        let parsed: z.infer<typeof Body>;
        try { parsed = Body.parse(await request.json()); }
        catch (e) { return new Response(`invalid body: ${String(e)}`, { status: 400 }); }

        const { data: device } = await supabaseAdmin
          .from("devices")
          .select("id, device_token_hash")
          .eq("id", parsed.device_id)
          .maybeSingle();
        if (!device || device.device_token_hash !== sha256(token)) {
          return new Response("device unauthorized", { status: 401 });
        }

        await supabaseAdmin
          .from("devices")
          .update({ is_online: true, last_seen_at: new Date().toISOString() })
          .eq("id", device.id);

        return Response.json({ ok: true });
      },
    },
  },
});
