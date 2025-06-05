import {supabase} from '@/lib/supabaseClient'

export const getOrCreateConversation = async (
  user1: string,
  user2: string
): Promise<string> => {
  const participant_ids: string[] = [user1, user2].sort();

  const serializedArray = `{${participant_ids.join(",")}}`; // <-- Important!

  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .filter("participant_ids", "eq", serializedArray) // use raw filter with array literal
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error: insertError } = await supabase
    .from("conversations")
    .insert([{ participant_ids }]) // inserting JS array is okay here
    .select("id")
    .single();

  if (insertError) throw insertError;
  return data.id;
};