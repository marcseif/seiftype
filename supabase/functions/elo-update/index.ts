import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const K = 32;

function calculateExpected(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

function calculateNewElo(
  oldElo: number,
  expected: number,
  actual: number
): number {
  return Math.round(oldElo + K * (actual - expected));
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { race_id, winner_id, loser_id } = await req.json();

    if (!race_id || !winner_id || !loser_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: race_id, winner_id, loser_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch both players' current ELO from the users table
    const { data: winnerData, error: winnerError } = await supabase
      .from("users")
      .select("elo")
      .eq("id", winner_id)
      .single();

    if (winnerError) {
      throw new Error(`Failed to fetch winner: ${winnerError.message}`);
    }

    const { data: loserData, error: loserError } = await supabase
      .from("users")
      .select("elo")
      .eq("id", loser_id)
      .single();

    if (loserError) {
      throw new Error(`Failed to fetch loser: ${loserError.message}`);
    }

    const winnerOldElo: number = winnerData.elo;
    const loserOldElo: number = loserData.elo;

    // Calculate new ELO ratings
    const winnerExpected = calculateExpected(winnerOldElo, loserOldElo);
    const loserExpected = calculateExpected(loserOldElo, winnerOldElo);

    const winnerNewElo = calculateNewElo(winnerOldElo, winnerExpected, 1);
    const loserNewElo = calculateNewElo(loserOldElo, loserExpected, 0);

    const winnerDelta = winnerNewElo - winnerOldElo;
    const loserDelta = loserNewElo - loserOldElo;

    // Update both players' ELO in the users table
    const { error: updateWinnerError } = await supabase
      .from("users")
      .update({ elo: winnerNewElo })
      .eq("id", winner_id);

    if (updateWinnerError) {
      throw new Error(`Failed to update winner ELO: ${updateWinnerError.message}`);
    }

    const { error: updateLoserError } = await supabase
      .from("users")
      .update({ elo: loserNewElo })
      .eq("id", loser_id);

    if (updateLoserError) {
      throw new Error(`Failed to update loser ELO: ${updateLoserError.message}`);
    }

    // Update the race record with results
    const { error: raceError } = await supabase
      .from("races")
      .update({
        winner_id,
        loser_id,
        winner_elo_before: winnerOldElo,
        loser_elo_before: loserOldElo,
        winner_elo_after: winnerNewElo,
        loser_elo_after: loserNewElo,
        status: "completed",
      })
      .eq("id", race_id);

    if (raceError) {
      throw new Error(`Failed to update race record: ${raceError.message}`);
    }

    return new Response(
      JSON.stringify({
        winner_new_elo: winnerNewElo,
        loser_new_elo: loserNewElo,
        winner_delta: winnerDelta,
        loser_delta: loserDelta,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
