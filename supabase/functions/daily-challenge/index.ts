import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Built-in word list for generating daily challenge passages
const wordPool = [
  // Common words
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  // Action words
  "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "running",
  "through", "forest", "while", "birds", "sing", "above", "trees",
  "flowing", "river", "beneath", "bridge", "old", "stone", "path",
  "leads", "toward", "distant", "mountain", "peaks", "covered", "snow",
  // Typing practice words
  "keyboard", "practice", "typing", "speed", "accuracy", "fingers",
  "position", "rhythm", "steady", "focus", "improve", "challenge",
  "movement", "careful", "precise", "flowing", "smooth", "natural",
  "comfort", "technique", "muscle", "memory", "progress", "achieve",
  // Descriptive words
  "bright", "silent", "warm", "gentle", "strong", "calm", "swift",
  "deep", "clear", "fresh", "golden", "silver", "purple", "crimson",
  "ancient", "modern", "simple", "complex", "hidden", "open", "vast",
  // Connecting words
  "across", "between", "around", "within", "beyond", "against",
  "during", "before", "after", "along", "among", "without", "into",
  "under", "near", "behind", "beside", "until", "upon", "since",
];

// Sentence templates for more natural passages
const templates = [
  "The {adj} {noun} {verb} {prep} the {adj} {noun}.",
  "A {adj} {noun} {verb} while the {noun} {verb} {adv}.",
  "{noun} and {noun} {verb} {prep} the {adj} {noun}.",
  "The {noun} {verb} {adv} {prep} {adj} {noun}.",
  "Every {adj} {noun} {verb} with {adj} {noun}.",
];

const adjectives = [
  "quick", "bright", "silent", "warm", "gentle", "strong", "calm", "swift",
  "deep", "clear", "fresh", "golden", "ancient", "modern", "simple", "vast",
  "steady", "smooth", "natural", "precise", "careful", "hidden", "open",
  "purple", "crimson", "silver", "distant", "old", "lazy", "brown",
];

const nouns = [
  "fox", "river", "mountain", "forest", "bridge", "path", "bird", "tree",
  "stone", "keyboard", "fingers", "rhythm", "challenge", "technique",
  "progress", "movement", "memory", "comfort", "peaks", "snow", "dog",
  "speed", "position", "focus", "practice", "typing", "accuracy",
];

const verbs = [
  "jumps", "runs", "flows", "leads", "sings", "moves", "reaches",
  "glides", "dances", "rests", "grows", "shines", "rises", "falls",
  "turns", "stands", "passes", "crosses", "follows", "watches",
];

const adverbs = [
  "quickly", "gently", "silently", "steadily", "smoothly", "carefully",
  "swiftly", "calmly", "brightly", "softly", "firmly", "slowly",
];

const prepositions = [
  "over", "through", "across", "beneath", "toward", "beyond",
  "around", "between", "along", "beside", "under", "near",
];

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Ensures the same date always produces the same passage.
 */
function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generatePassage(dateStr: string): string {
  const seed = dateToSeed(dateStr);
  const rng = seededRandom(seed);

  const sentences: string[] = [];
  let wordCount = 0;
  const targetWords = 50;

  while (wordCount < targetWords) {
    const template = pick(templates, rng);
    const sentence = template
      .replace(/\{adj\}/g, () => pick(adjectives, rng))
      .replace(/\{noun\}/g, () => pick(nouns, rng))
      .replace(/\{verb\}/g, () => pick(verbs, rng))
      .replace(/\{adv\}/g, () => pick(adverbs, rng))
      .replace(/\{prep\}/g, () => pick(prepositions, rng));

    sentences.push(sentence);
    wordCount += sentence.split(/\s+/).length;
  }

  return sentences.join(" ");
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = getTodayDateString();

    // Check if today's challenge already exists
    const { data: existing, error: fetchError } = await supabase
      .from("daily_challenges")
      .select("id, text, date")
      .eq("date", today)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch daily challenge: ${fetchError.message}`);
    }

    if (existing) {
      return new Response(
        JSON.stringify({
          id: existing.id,
          text: existing.text,
          date: existing.date,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate today's passage using date-seeded RNG
    const text = generatePassage(today);

    // Upsert into daily_challenges table
    const { data: upserted, error: upsertError } = await supabase
      .from("daily_challenges")
      .upsert({ date: today, text }, { onConflict: "date" })
      .select("id, text, date")
      .single();

    if (upsertError) {
      throw new Error(`Failed to upsert daily challenge: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        id: upserted.id,
        text: upserted.text,
        date: upserted.date,
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
