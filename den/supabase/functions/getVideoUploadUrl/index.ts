import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    // Retrieve Cloudflare credentials from environment variables
    const API_TOKEN = Deno.env.get("CLOUDFLARE_API_KEY");
    const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

    if (!API_TOKEN || !ACCOUNT_ID) {
      return new Response(
        JSON.stringify({ error: "Missing Cloudflare API configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare the JSON payload
    const payload = { maxDurationSeconds: 3600 };

    // Make the POST request to Cloudflare Stream's direct_upload endpoint
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // Check if the response is OK
    if (!cloudflareResponse.ok) {
      const errorData = await cloudflareResponse.json();
      return new Response(
        JSON.stringify({ error: "Cloudflare API error", details: errorData }),
        { status: cloudflareResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and return the result from Cloudflare's response
    const { result } = await cloudflareResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
