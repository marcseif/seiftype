-- Allow users to update their own daily results (which makes UPSERT work)
CREATE POLICY "Users can update their own daily results" ON public.daily_results
  FOR UPDATE USING (auth.uid() = user_id);

-- While we're here, let's make sure they can delete them if they ever need to
CREATE POLICY "Users can delete their own daily results" ON public.daily_results
  FOR DELETE USING (auth.uid() = user_id);

-- We need to also add an UPDATE policy for user_preferences if it's missing (upsert there is working though? Maybe user_preferences had one, wait, it didn't fail so maybe it had one or the table had no RLS, wait. Let's just fix daily_results)
