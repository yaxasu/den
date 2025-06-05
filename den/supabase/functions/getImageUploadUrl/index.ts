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

    // Create a FormData instance with the required fields
    const formData = new FormData();
    formData.append("requireSignedURLs", "true");
    formData.append("metadata", JSON.stringify({ key: "value" })); // optional metadata

    // Make the POST request to Cloudflare Images' direct_upload endpoint
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          // Note: When sending FormData, the Content-Type header is automatically set with the boundary.
        },
        body: formData,
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

    // Parse and return the uploadURL from Cloudflare's response
    const { result } = await cloudflareResponse.json();
    return new Response(
      JSON.stringify({ uploadURL: result.uploadURL }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
