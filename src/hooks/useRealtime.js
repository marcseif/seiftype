import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Supabase Realtime subscription hook.
 *
 * Provides low-level subscribe/unsubscribe lifecycle management with automatic
 * cleanup on unmount, plus purpose-built helpers for race updates, daily
 * leaderboard changes, and presence tracking.
 */
export default function useRealtime(channelName, eventFilter, callback) {
  const channelRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // ---------------------------------------------------------------------------
  // Core subscribe / unsubscribe
  // ---------------------------------------------------------------------------
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const subscribe = useCallback(() => {
    // Tear down any existing subscription first
    unsubscribe();

    if (!channelName) return;

    const channel = supabase.channel(channelName);

    if (eventFilter) {
      // eventFilter example: { event: 'postgres_changes', schema: 'public', table: 'races', filter: 'id=eq.xxx' }
      const { event, schema, table, filter: pgFilter } = eventFilter;

      if (event === 'postgres_changes') {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: schema || 'public',
            table,
            ...(pgFilter ? { filter: pgFilter } : {}),
          },
          (payload) => {
            if (callbackRef.current) callbackRef.current(payload);
          }
        );
      } else {
        // Generic broadcast listener
        channel.on('broadcast', { event }, (payload) => {
          if (callbackRef.current) callbackRef.current(payload);
        });
      }
    }

    channel.subscribe();
    channelRef.current = channel;
  }, [channelName, eventFilter, unsubscribe]);

  // Auto-subscribe when params change, auto-cleanup on unmount
  useEffect(() => {
    if (channelName) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
    // Re-subscribe when channel name or filter identity changes.
    // We JSON-serialise the filter so the effect fires on deep changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, JSON.stringify(eventFilter)]);

  return { subscribe, unsubscribe, channel: channelRef.current };
}

// ---------------------------------------------------------------------------
// Pre-built helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time updates on a specific race row.
 */
export function useRaceUpdates(raceId, onUpdate) {
  const channelName = raceId ? `race:${raceId}` : null;
  const eventFilter = raceId
    ? { event: 'postgres_changes', schema: 'public', table: 'races', filter: `id=eq.${raceId}` }
    : null;

  return useRealtime(channelName, eventFilter, onUpdate);
}

/**
 * Subscribe to daily leaderboard inserts/updates for a given date (YYYY-MM-DD).
 */
export function useDailyLeaderboard(date, onUpdate) {
  const channelName = date ? `daily:${date}` : null;
  const eventFilter = date
    ? { event: 'postgres_changes', schema: 'public', table: 'daily_results', filter: `challenge_date=eq.${date}` }
    : null;

  return useRealtime(channelName, eventFilter, onUpdate);
}

/**
 * Presence helper -- tracks who is online in a race room.
 *
 * Returns { subscribe, unsubscribe, channel } plus helpers to track/untrack
 * the local user and respond to presence sync events.
 */
export function usePresence(roomId, userMeta, onSync) {
  const channelRef = useRef(null);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const subscribe = useCallback(() => {
    unsubscribe();
    if (!roomId) return;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userMeta?.userId || 'anon' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (onSyncRef.current) onSyncRef.current(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (onSyncRef.current) {
          onSyncRef.current(channel.presenceState(), { event: 'join', key, newPresences });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (onSyncRef.current) {
          onSyncRef.current(channel.presenceState(), { event: 'leave', key, leftPresences });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userMeta) {
          await channel.track(userMeta);
        }
      });

    channelRef.current = channel;
  }, [roomId, userMeta, unsubscribe]);

  useEffect(() => {
    if (roomId) subscribe();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, JSON.stringify(userMeta)]);

  return { subscribe, unsubscribe, channel: channelRef.current };
}
