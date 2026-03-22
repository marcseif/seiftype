import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Auth helpers
export async function signUpWithEmail(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  return { data, error };
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function resetPasswordForEmail(email) {
  // If email enumeration protection is off, this WILL throw an error if the email doesn't exist
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  return { data, error };
}

export async function linkOAuthIdentity(provider) {
  const { data, error } = await supabase.auth.linkIdentity({ provider });
  return { data, error };
}

export async function unlinkOAuthIdentity(identityId) {
  const { data, error } = await supabase.auth.unlinkIdentity({ identity_id: identityId });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Profile helpers
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function uploadAvatarFile(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) return { error: uploadError };

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return { data };
}

// Test results
export async function saveTestResult(result) {
  const { data, error } = await supabase
    .from('test_results')
    .insert(result)
    .select()
    .single();
  return { data, error };
}

export async function getTestResults(userId, limit = 100) {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function getTestResultsInRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });
  return { data, error };
}

// User preferences
export async function getPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function updatePreferences(userId, prefs) {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}

// Achievements
export async function getUserAchievements(userId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  return { data, error };
}

export async function unlockAchievement(userId, achievementKey) {
  const { data, error } = await supabase
    .from('achievements')
    .upsert(
      { user_id: userId, achievement_key: achievementKey },
      { onConflict: 'user_id,achievement_key' }
    )
    .select()
    .single();
  return { data, error };
}

// Daily challenges
export async function getDailyChallenge(date) {
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', date)
    .maybeSingle();
  return { data, error };
}

export async function getDailyLeaderboard(date, limit = 20) {
  const { data, error } = await supabase
    .from('daily_results')
    .select('*, users(username, avatar_url, level)')
    .eq('challenge_date', date)
    .order('wpm', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function submitDailyResult(result) {
  const { data, error } = await supabase
    .from('daily_results')
    .upsert(result, { onConflict: 'user_id,challenge_date' })
    .select()
    .single();
  return { data, error };
}

// Races
export async function createRace(race) {
  const { data, error } = await supabase
    .from('races')
    .insert(race)
    .select()
    .single();
  return { data, error };
}

export async function getRace(raceId) {
  const { data, error } = await supabase
    .from('races')
    .select('*, player1:users!races_player1_id_fkey(*), player2:users!races_player2_id_fkey(*)')
    .eq('id', raceId)
    .single();
  return { data, error };
}

export async function getRaceByCode(roomCode) {
  const { data, error } = await supabase
    .from('races')
    .select('*, player1:users!races_player1_id_fkey(*), player2:users!races_player2_id_fkey(*)')
    .eq('room_code', roomCode)
    .eq('status', 'waiting')
    .single();
  return { data, error };
}

export async function updateRace(raceId, updates) {
  const { data, error } = await supabase
    .from('races')
    .update(updates)
    .eq('id', raceId)
    .select()
    .single();
  return { data, error };
}

// Matchmaking
export async function joinMatchmaking(userId, elo) {
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .upsert({ user_id: userId, elo })
    .select()
    .single();
  return { data, error };
}

export async function leaveMatchmaking(userId) {
  const { error } = await supabase
    .from('matchmaking_queue')
    .delete()
    .eq('user_id', userId);
  return { error };
}

export async function findMatch(userId, elo, range = 200) {
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .neq('user_id', userId)
    .gte('elo', elo - range)
    .lte('elo', elo + range)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();
  return { data, error };
}

// Weak bigrams
export async function getWeakBigrams(userId, limit = 20) {
  const { data, error } = await supabase
    .from('weak_bigrams')
    .select('*')
    .eq('user_id', userId)
    .order('avg_delay_ms', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function upsertBigrams(userId, bigrams) {
  const rows = bigrams.map((b) => ({
    user_id: userId,
    bigram: b.bigram,
    avg_delay_ms: b.avg_delay_ms,
    error_rate: b.error_rate,
    sample_count: b.sample_count,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('weak_bigrams')
    .upsert(rows, { onConflict: 'user_id,bigram' });
  return { data, error };
}

// Leaderboard
export async function getGlobalLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, elo, xp, tests_completed')
    .order('elo', { ascending: false })
    .limit(limit);
  return { data, error };
}

// ===========================================================================
// FRIENDS API
// ===========================================================================

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, user:users!friendships_user_id_fkey(id, username, avatar_url, elo), friend:users!friendships_friend_id_fkey(id, username, avatar_url, elo)')
    .eq('status', 'accepted')
    .or('user_id.eq.' + userId + ',friend_id.eq.' + userId);

  if (error) return { error };

  const friends = data.map(f => {
    const isInitiator = f.user_id === userId;
    return {
      friendship_id: f.id,
      status: f.status,
      created_at: f.created_at,
      friend: isInitiator ? f.friend : f.user,
    };
  });

  return { data: friends };
}

export async function getPendingFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, user:users!friendships_user_id_fkey(id, username, avatar_url, elo)')
    .eq('friend_id', userId)
    .eq('status', 'pending');
  return { data, error };
}

export async function sendFriendRequest(userId, friendId) {
  if (userId === friendId) return { error: { message: 'Cannot add yourself' } };

  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or('and(user_id.eq.' + userId + ',friend_id.eq.' + friendId + '),and(user_id.eq.' + friendId + ',friend_id.eq.' + userId + ')')
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') return { error: { message: 'Already friends' } };
      if (existing.status === 'pending') {
        if (existing.friend_id === userId) {
          return acceptFriendRequest(existing.id);
        }
        return { error: { message: 'Request already sent' } };
      }
    }

    const { data, error } = await supabase
    .from('friendships')
    .insert({ user_id: userId, friend_id: friendId, status: 'pending' })
    .select()
    .single();
  return { data, error };
}

export async function acceptFriendRequest(friendshipId) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select()
    .single();
  return { data, error };
}

export async function removeFriend(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  return { error };
}

export async function getFriendshipStatus(userId, otherUserId) {
  if (!userId || !otherUserId || userId === otherUserId) return { data: null };

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or('and(user_id.eq.' + userId + ',friend_id.eq.' + otherUserId + '),and(user_id.eq.' + otherUserId + ',friend_id.eq.' + userId + ')')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') return { error };

  if (!data) return { data: null };

  return {
    data: {
      id: data.id,
      status: data.status,
      isInitiator: data.user_id === userId
    }
  };
}

