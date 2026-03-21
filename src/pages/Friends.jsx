import { useState, useEffect } from 'react';
import { FiUserPlus, FiCheck, FiX, FiTrash2, FiSearch } from 'react-icons/fi';
import useUserStore from '../stores/userStore';
import {
  getFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  supabase
} from '../lib/supabase';
import { motion } from 'framer-motion';

export default function Friends() {
  const { user, profile } = useUserStore();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState('');
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [friendsRes, pendingRes] = await Promise.all([
      getFriends(user.id),
      getPendingFriendRequests(user.id)
    ]);
    if (friendsRes.data) setFriends(friendsRes.data);
    if (pendingRes.data) setPending(pendingRes.data);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setSearchResult('');
    
    // Quick local lookup in DB for user
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', searchUsername)
      .single();
      
    if (!data) {
      setSearchResult('User not found.');
      return;
    }
    
    // Found user - send request
    const res = await sendFriendRequest(user.id, data.id);
    if (res.error) {
      setSearchResult(res.error.message);
    } else {
      setSearchResult('Friend request sent!');
    }
  };

  const handleAccept = async (id) => {
    await acceptFriendRequest(id);
    loadData();
  };

  const handleRemove = async (id) => {
    if(window.confirm('Are you sure you want to remove this friend?')) {
      await removeFriend(id);
      loadData();
    }
  };

  const handleReject = async (id) => {
    await removeFriend(id);
    loadData();
  };

  if (!user) return <div className="p-8 text-center text-secondary">Please sign in to view friends.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {/* Add Friend */}
          <div className="p-6 rounded-lg border mb-8" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiUserPlus /> Add Friend
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search username..."
                className="flex-1 px-4 py-2 rounded bg-transparent border focus:outline-none"
                style={{ borderColor: 'var(--color-border)' }}
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded font-medium flex items-center gap-2"
                style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                <FiSearch /> Add
              </button>
            </form>
            {searchResult && <p className="mt-2 text-sm text-secondary">{searchResult}</p>}
          </div>

          {/* Pending Requests */}
          <div className="p-6 rounded-lg border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4">Pending Requests ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-secondary text-sm">No pending requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded bg-black/10 border" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-medium">{p.user?.username || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAccept(p.id)} className="p-1.5 rounded hover:bg-green-500/20 text-green-500">
                        <FiCheck />
                      </button>
                      <button onClick={() => handleReject(p.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-500">
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div>
          <div className="p-6 rounded-lg border h-full" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4">My Friends ({friends.length})</h2>
            {loading ? (
              <p className="text-secondary text-sm">Loading...</p>
            ) : friends.length === 0 ? (
              <p className="text-secondary text-sm">You haven't added any friends yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {friends.map(f => {
                  const friendInfo = f.friend;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      key={f.friendship_id} 
                      className="flex items-center justify-between p-3 rounded bg-black/10 border group" 
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {friendInfo?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-lg">{friendInfo?.username}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRemove(f.friendship_id)} 
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-500"
                          title="Remove Friend"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}