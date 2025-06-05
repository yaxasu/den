// delete-image.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed. Use POST." }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const { imageId } = await req.json();

    if (!imageId || typeof imageId !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid or missing imageId in request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const API_TOKEN = Deno.env.get("CLOUDFLARE_API_KEY");
    const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

    if (!API_TOKEN || !ACCOUNT_ID) {
      return new Response(
        JSON.stringify({ error: "Missing Cloudflare API configuration." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`;
    console.log("Deleting image from Cloudflare:", deleteUrl);

    const cloudflareResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const result = await cloudflareResponse.json();
    console.log("Cloudflare DELETE response:", JSON.stringify(result, null, 2));

    if (!cloudflareResponse.ok || !result.success || (result.errors?.length ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare API error",
          status: cloudflareResponse.status,
          cloudflareResult: result,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
