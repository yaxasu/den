// supabase/functions/generate_recommendations/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete old recommendations for the user
    const { error: deleteError } = await supabase
      .from("recommended_posts")
      .delete()
      .eq("user_id", user_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call RPC function to get recommendations
    const { data: recommendations, error: rpcError } = await supabase.rpc(
      "generate_recommendations_for_user",
      { input_user_id: user_id }
    );

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!recommendations || recommendations.length === 0) {
      return new Response(JSON.stringify({ message: "No recommendations found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert new recommendations
    const insertPayload = recommendations.map((rec: any) => ({
      user_id,
      post_id: rec.post_id,
      score: rec.score,
      reason: "liked-by-similar-users",
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("recommended_posts")
      .insert(insertPayload);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ status: "success", inserted: insertPayload.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
