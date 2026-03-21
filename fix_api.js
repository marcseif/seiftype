const fs = require('fs');
const content = 

// ===========================================================================
// FRIENDS API
// ===========================================================================

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, user:users!friendships_user_id_fkey(id, username, avatar_url, elo), friend:users!friendships_friend_id_fkey(id, username, avatar_url, elo)')
    .eq('status', 'accepted')
    .or(\user_id.eq.\,friend_id.eq.\\);

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
    .or(\nd(user_id.eq.\,friend_id.eq.\),and(user_id.eq.\,friend_id.eq.\)\)
    .single();

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
    .or(\nd(user_id.eq.\,friend_id.eq.\),and(user_id.eq.\,friend_id.eq.\)\)
    .single();
  
  if (error && error.code !== 'PGRST116') return { error };
  
  if (!data) return { data: { status: 'none' } };

  return { 
    data: {
      id: data.id,
      status: data.status,
      isInitiator: data.user_id === userId
    }
  };
}
;
let file = fs.readFileSync('src/lib/supabase.js', 'utf8');
if (!file.includes('getFriends')) {
  fs.writeFileSync('src/lib/supabase.js', file + content, 'utf8');
  console.log('Appended to supabase.js');
} else {
  console.log('Already there');
}
