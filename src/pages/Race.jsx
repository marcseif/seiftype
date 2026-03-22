import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import useUserStore from '../stores/userStore';
import useRaceStore from '../stores/raceStore';
import usePreferencesStore from '../stores/preferencesStore';
import { supabase, createRace, getRaceByCode, updateRace, joinMatchmaking, leaveMatchmaking, findMatch } from '../lib/supabase';
import { calculateElo, generateRoomCode } from '../lib/elo';
import { getRandomWords } from '../data/words';
import MatchmakingScreen from '../components/race/MatchmakingScreen';
import RaceProgress from '../components/race/RaceProgress';
import RankBadge from '../components/profile/RankBadge';
import TypingDisplay from '../components/typing/TypingDisplay';
import LiveStats from '../components/typing/LiveStats';
import useTypingEngine from '../hooks/useTypingEngine';
import { toastElo, toastXP } from '../components/ui/Toast';
import { calculateXP } from '../lib/metrics';

export default function Race() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, addXP } = useUserStore();
  const race = useRaceStore();
  const { caretStyle, smoothCaret, font, fontSize } = usePreferencesStore();

  const isPresent = useIsPresent();

  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ranked'); // ranked | custom
  const containerRef = useRef(null);
  const matchIntervalRef = useRef(null);

  // Typing engine for when race is active
  const engine = useTypingEngine(
    race.passage,
    'words',
    race.passage ? race.passage.split(' ').length : 50,
    handleRaceComplete
  );

  useEffect(() => {
    if (!isPresent) {
      engine.pause();
    }
  }, [isPresent, engine]);

  // Update local progress to supabase during race
  useEffect(() => {
    if (race.status !== 'racing' || !race.raceId) return;
    const isP1 = race.localPlayerId === profile?.id;
    const progress = engine.totalChars > 0
      ? (engine.charIndex / engine.charStates.length) * 100
      : 0;

    const updates = isP1
      ? { player1_progress: progress, player1_wpm: engine.wpm, player1_accuracy: engine.accuracy }
      : { player2_progress: progress, player2_wpm: engine.wpm, player2_accuracy: engine.accuracy };

    const interval = setInterval(() => {
      updateRace(race.raceId, updates);
      race.updateLocalProgress(progress, engine.wpm, engine.accuracy);
    }, 500);

    return () => clearInterval(interval);
  }, [
    race,
    engine.wpm,
    engine.charIndex,
    engine.totalChars,
    engine.charStates.length,
    engine.accuracy,
    profile?.id,
  ]);

  // Subscribe to race updates via realtime
  useEffect(() => {
    if (!race.raceId) return;

    const channel = supabase
      .channel(`race-${race.raceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'races',
        filter: `id=eq.${race.raceId}`,
      }, (payload) => {
        const data = payload.new;
        const isP1 = race.localPlayerId === data.player1_id;

        // Update opponent progress
        if (isP1) {
          race.updateOpponentProgress(data.player2_progress || 0, data.player2_wpm || 0);
        } else {
          race.updateOpponentProgress(data.player1_progress || 0, data.player1_wpm || 0);
        }

        // Check if race finished
        if (data.status === 'finished' && race.status !== 'finished') {
          const eloDelta = isP1 ? data.elo_delta_p1 : data.elo_delta_p2;
          const oppDelta = isP1 ? data.elo_delta_p2 : data.elo_delta_p1;
          race.setResults(data.winner_id, eloDelta, oppDelta);
          toastElo(eloDelta);
          refreshProfile();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [race, refreshProfile]);

  async function handleRaceComplete(results) {
    if (!race.raceId || race.status === 'finished') return;

    const isP1 = race.localPlayerId === profile?.id;
    const updates = {
      status: 'finished',
      winner_id: profile.id,
      finished_at: new Date().toISOString(),
    };

    if (isP1) {
      updates.player1_wpm = results.wpm;
      updates.player1_accuracy = results.accuracy;
      updates.player1_progress = 100;
    } else {
      updates.player2_wpm = results.wpm;
      updates.player2_accuracy = results.accuracy;
      updates.player2_progress = 100;
    }

    // Calculate ELO
    const opponentElo = race.opponentElo || 1000;
    const myElo = profile.elo || 1000;
    const { deltaA, deltaB } = calculateElo(myElo, opponentElo, 1);
    updates.elo_delta_p1 = isP1 ? deltaA : deltaB;
    updates.elo_delta_p2 = isP1 ? deltaB : deltaA;

    await updateRace(race.raceId, updates);

      // Add XP and notify user
      const xp = calculateXP(results.wpm, results.accuracy, results.elapsed);
      const wpmXP = Math.floor(xp * 0.7);
      const accXP = xp - wpmXP;
      addXP(xp);
      toastXP(xp, { wpmXP, accXP });
    }
  // Matchmaking: join queue and poll for matches
  async function startMatchmaking() {
    race.reset();
    race.setStatus('searching');
    race.setLocalPlayer(profile.id);

    await joinMatchmaking(profile.id, profile.elo || 1000);

    let range = 100;
    matchIntervalRef.current = setInterval(async () => {
      const { data: match } = await findMatch(profile.id, profile.elo || 1000, range);
      if (match) {
        clearInterval(matchIntervalRef.current);
        await leaveMatchmaking(profile.id);
        await leaveMatchmaking(match.user_id);
        await createRaceWithOpponent(match.user_id);
      }
      range = Math.min(range + 50, 500); // Widen search over time
    }, 3000);
  }

  async function createRaceWithOpponent(opponentId) {
    const passage = getRandomWords(30, 'medium').join(' ');
    const roomCode = generateRoomCode();

    const { data: raceData } = await createRace({
      room_code: roomCode,
      player1_id: profile.id,
      player2_id: opponentId,
      passage,
      status: 'countdown',
    });

    if (!raceData) return;

    // Get opponent info
    const { data: oppProfile } = await supabase.from('users').select('*').eq('id', opponentId).single();

    race.setRace(raceData);
    race.setOpponent({
      id: opponentId,
      username: oppProfile?.username || 'Opponent',
      elo: oppProfile?.elo || 1000,
      avatar_url: oppProfile?.avatar_url,
    });
    race.setStatus('countdown');

    // Countdown 3-2-1-GO
    let count = 3;
    race.setCountdown(count);
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        race.setCountdown(count);
      } else if (count === 0) {
        race.setCountdown(0);
      } else {
        clearInterval(countdownInterval);
        race.setStatus('racing');
        updateRace(raceData.id, { status: 'racing', started_at: new Date().toISOString() });
        containerRef.current?.focus({ preventScroll: true });
      }
    }, 1000);
  }

  function cancelMatchmaking() {
    clearInterval(matchIntervalRef.current);
    leaveMatchmaking(profile.id);
    race.reset();
  }

  // Custom room: create
  async function createRoom() {
    const passage = getRandomWords(30, 'medium').join(' ');
    const roomCode = generateRoomCode();

    const { data: raceData, error: raceError } = await createRace({
      room_code: roomCode,
      player1_id: profile.id,
      passage,
      status: 'waiting',
    });

    if (raceError) {
      setError(raceError.message);
      return;
    }

    race.setRace(raceData);
    race.setRoomCode(roomCode);
    race.setLocalPlayer(profile.id);
    race.setStatus('waiting');

    // Listen for player2 to join
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'races',
        filter: `id=eq.${raceData.id}`,
      }, async (payload) => {
        if (payload.new.player2_id && payload.new.status === 'countdown') {
          const { data: oppProfile } = await supabase.from('users').select('*').eq('id', payload.new.player2_id).single();
          race.setOpponent({
            id: payload.new.player2_id,
            username: oppProfile?.username || 'Opponent',
            elo: oppProfile?.elo || 1000,
            avatar_url: oppProfile?.avatar_url,
          });
          supabase.removeChannel(channel);

          // Start countdown
          let count = 3;
          race.setStatus('countdown');
          race.setCountdown(count);
          const ci = setInterval(() => {
            count--;
            if (count > 0) race.setCountdown(count);
            else if (count === 0) race.setCountdown(0);
            else {
              clearInterval(ci);
              race.setStatus('racing');
              containerRef.current?.focus({ preventScroll: true });
            }
          }, 1000);
        }
      })
      .subscribe();
  }

  // Custom room: join
  async function joinRoom() {
    if (!roomInput.trim()) return;
    setError('');

    const { data: raceData, error: raceError } = await getRaceByCode(roomInput.trim().toUpperCase());
    if (raceError || !raceData) {
      setError('Room not found or already started.');
      return;
    }

    // Join as player 2
    await updateRace(raceData.id, {
      player2_id: profile.id,
      status: 'countdown',
    });

    const { data: oppProfile } = await supabase.from('users').select('*').eq('id', raceData.player1_id).single();

    race.setRace(raceData);
    race.setLocalPlayer(profile.id);
    race.setOpponent({
      id: raceData.player1_id,
      username: oppProfile?.username || 'Opponent',
      elo: oppProfile?.elo || 1000,
      avatar_url: oppProfile?.avatar_url,
    });

    // Countdown
    let count = 3;
    race.setStatus('countdown');
    race.setCountdown(count);
    const ci = setInterval(() => {
      count--;
      if (count > 0) race.setCountdown(count);
      else if (count === 0) race.setCountdown(0);
      else {
        clearInterval(ci);
        race.setStatus('racing');
        containerRef.current?.focus({ preventScroll: true });
      }
    }, 1000);
  }

  function handleRematch() {
    race.reset();
    engine.reset();
    if (tab === 'ranked') startMatchmaking();
    else createRoom();
  }

  // Auth guard
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-4xl">⚔️</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Sign in to Race</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          You need an account to compete in ranked races.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  // Render based on race status
  if (race.status === 'searching' || race.status === 'found' || race.status === 'countdown') {
    return (
      <MatchmakingScreen
        status={race.status === 'countdown' ? 'countdown' : race.status}
        opponentUsername={race.opponentUsername}
        opponentElo={race.opponentElo}
        countdownValue={race.countdownValue}
        onCancel={cancelMatchmaking}
      />
    );
  }

  if (race.status === 'racing') {
    const progress = engine.charStates.length > 0
      ? (engine.charIndex / engine.charStates.length) * 100
      : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <RaceProgress
          localProgress={progress}
          localWPM={engine.wpm}
          localUsername={profile.username}
          opponentProgress={race.opponentProgress}
          opponentWPM={race.opponentWPM}
          opponentUsername={race.opponentUsername}
          finished={false}
        />

        <LiveStats wpm={engine.wpm} accuracy={engine.accuracy} elapsed={engine.elapsed} mode="words" isActive={engine.isActive} />

        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault(); // Stop tab-jumping entirely while racing
            }
            engine.handleKeyDown(e);
          }}
          className="outline-none rounded-xl border p-6 cursor-text"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          autoFocus
        >
          <TypingDisplay
            charStates={engine.charStates}
            charIndex={engine.charIndex}
            caretStyle={caretStyle}
            smoothCaret={smoothCaret}
            font={font}
            fontSize={fontSize}
          />
        </div>
      </div>
    );
  }

  if (race.status === 'finished') {
    const localWon = race.winnerId === race.localPlayerId;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <RaceProgress
          localProgress={race.localProgress}
          localWPM={race.localWPM}
          localUsername={profile.username}
          opponentProgress={race.opponentProgress}
          opponentWPM={race.opponentWPM}
          opponentUsername={race.opponentUsername}
          finished
          winnerId={race.winnerId}
          localPlayerId={race.localPlayerId}
        />

        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-5xl mb-3"
          >
            {localWon ? '🏆' : '😤'}
          </motion.div>
          <h2 className="text-2xl font-black mb-2" style={{ color: localWon ? 'var(--color-success)' : 'var(--color-error)' }}>
            {localWon ? 'Victory!' : 'Defeat'}
          </h2>

          <div className="flex justify-center gap-6 my-4">
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Your WPM</div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(engine.wpm)}</div>
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ELO Change</div>
              <div className="text-xl font-bold" style={{ color: race.eloDelta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {race.eloDelta >= 0 ? '+' : ''}{race.eloDelta}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={handleRematch}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Rematch
            </button>
            <button
              onClick={() => race.reset()}
              className="px-5 py-2.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default: Race lobby
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--color-text)' }}>Race Mode</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Challenge other typists in real-time 1v1 races
        </p>
      </div>

      {/* Player info */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'var(--color-surface)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{profile.username}</span>
          <RankBadge elo={profile.elo} size="sm" />
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 p-1 rounded-lg mx-auto max-w-xs" style={{ background: 'var(--color-bg-secondary)' }}>
        {['ranked', 'custom'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize"
            style={{
              background: tab === t ? 'var(--color-surface)' : 'transparent',
              color: tab === t ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'ranked' ? (
          <motion.div
            key="ranked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-6 text-center"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="text-3xl mb-3">⚔️</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>Ranked Match</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              Get matched with an opponent near your skill level. Win to gain ELO, lose and you'll drop.
            </p>
            <button
              onClick={startMatchmaking}
              className="px-6 py-3 rounded-lg text-sm font-bold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Find Match
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-6"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Create Room */}
              <div className="text-center">
                <div className="text-2xl mb-2">🏠</div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>Create Room</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Generate a code and share with a friend
                </p>
                {race.roomCode && race.status === 'waiting' ? (
                  <div>
                    <div
                      className="text-2xl font-mono font-black tracking-widest mb-2 select-all"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {race.roomCode}
                    </div>
                    <p className="text-xs animate-pulse" style={{ color: 'var(--color-text-muted)' }}>
                      Waiting for opponent...
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={createRoom}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    Create Room
                  </button>
                )}
              </div>

              {/* Join Room */}
              <div className="text-center">
                <div className="text-2xl mb-2">🔗</div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>Join Room</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Enter a room code to join a friend
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="ABCD12"
                    maxLength={6}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono text-center tracking-widest uppercase outline-none"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                  <button
                    onClick={joinRoom}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    Join
                  </button>
                </div>
                {error && <p className="text-xs mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
