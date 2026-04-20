import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../db/supabase';
import { toDateString } from '../utils/date';

const LOCAL_KEY = 'squad_my_user_id';

function getMyUserId() {
  return localStorage.getItem(LOCAL_KEY);
}
function setMyUserId(id) {
  localStorage.setItem(LOCAL_KEY, id);
}

// ── Generate a human-readable invite code e.g. "HAWK-4921" ──────────────────
function generateCode() {
  const words = ['HAWK', 'WOLF', 'BEAR', 'LYNX', 'FOX', 'BULL', 'KITE', 'STAG', 'CROW', 'SEAL'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// ── Push our latest snapshot to Supabase ────────────────────────────────────
export async function pushMyProfile(habits, logs) {
  const userId = getMyUserId();
  if (!userId) return;
  const today = toDateString(new Date());
  const todayDone = logs.filter((l) => l.date === today && l.completed).length;
  await supabase
    .from('squad_users')
    .update({
      habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color })),
      today_done: todayDone,
      today_total: habits.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export function useSquad(habits, logs) {
  const [myUser, setMyUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = getMyUserId();
    if (!id) { setLoading(false); return; }
    supabase
      .from('squad_users')
      .select('id, username')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setMyUser(data);
        setLoading(false);
      });
  }, []);

  // ── Poll friends ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myUser) return;
    fetchFriends();
    pollRef.current = setInterval(fetchFriends, 30_000);
    return () => clearInterval(pollRef.current);
  }, [myUser]);

  // ── Push profile on any habit/log change ─────────────────────────────────────
  useEffect(() => {
    if (!myUser) return;
    pushMyProfile(habits, logs);
  }, [habits, logs, myUser]);

  const fetchFriends = useCallback(async () => {
    if (!myUser) return;
    const { data: links } = await supabase
      .from('squad_friends')
      .select('friend_id')
      .eq('owner_id', myUser.id);
    if (!links || links.length === 0) { setFriends([]); return; }
    const ids = links.map((l) => l.friend_id);
    const { data: users } = await supabase
      .from('squad_users')
      .select('id, username, habits, today_done, today_total, updated_at')
      .in('id', ids);
    if (users) setFriends(users);
  }, [myUser]);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (username) => {
    setError('');
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) { setError('Username must be at least 3 characters (a–z, 0–9, _)'); return false; }

    const { data: existing } = await supabase
      .from('squad_users')
      .select('id')
      .eq('username', clean)
      .maybeSingle();
    if (existing) { setError('Username already taken, try another.'); return false; }

    const today = toDateString(new Date());
    const todayDone = logs.filter((l) => l.date === today && l.completed).length;

    const { data, error: insertErr } = await supabase
      .from('squad_users')
      .insert({
        username: clean,
        habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color })),
        today_done: todayDone,
        today_total: habits.length,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr || !data) { setError('Something went wrong. Try again.'); return false; }
    setMyUserId(data.id);
    setMyUser({ id: data.id, username: data.username });
    return true;
  }, [habits, logs]);

  // ── Generate invite code ─────────────────────────────────────────────────────
  const generateInviteCode = useCallback(async () => {
    if (!myUser) return null;

    // Try up to 5 times to get a unique code
    for (let i = 0; i < 5; i++) {
      const code = generateCode();
      const { data, error: insertErr } = await supabase
        .from('squad_invite_codes')
        .insert({ owner_id: myUser.id, code })
        .select()
        .single();
      if (!insertErr && data) return code;
    }
    return null;
  }, [myUser]);

  // ── Add friend: requires username + valid invite code they generated ──────────
  const addFriendWithCode = useCallback(async (username, inviteCode) => {
    setError('');
    if (!myUser) return false;

    const cleanUsername = username.trim().toLowerCase();
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanUsername) { setError('Enter a username.'); return false; }
    if (!cleanCode) { setError('Enter the invite code.'); return false; }

    // Look up the user by username
    const { data: targetUser } = await supabase
      .from('squad_users')
      .select('id, username, habits, today_done, today_total, updated_at')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (!targetUser) { setError('No user found with that username.'); return false; }
    if (targetUser.id === myUser.id) { setError("You can't add yourself."); return false; }

    const alreadyAdded = friends.some((f) => f.id === targetUser.id);
    if (alreadyAdded) { setError('Already in your squad.'); return false; }

    // Validate the invite code belongs to that user and is unused + not expired
    const { data: codeRow } = await supabase
      .from('squad_invite_codes')
      .select('id, used, expires_at')
      .eq('owner_id', targetUser.id)
      .eq('code', cleanCode)
      .maybeSingle();

    if (!codeRow) { setError('Invalid invite code. Ask your friend to generate a new one.'); return false; }
    if (codeRow.used) { setError('This invite code has already been used.'); return false; }
    if (new Date(codeRow.expires_at) < new Date()) { setError('This invite code has expired. Ask your friend for a new one.'); return false; }

    // Mark code as used
    await supabase
      .from('squad_invite_codes')
      .update({ used: true })
      .eq('id', codeRow.id);

    // Create the friendship (one-directional: I follow them)
    const { error: insertErr } = await supabase
      .from('squad_friends')
      .insert({ owner_id: myUser.id, friend_id: targetUser.id });

    if (insertErr) { setError('Could not add friend. Try again.'); return false; }

    await fetchFriends();
    return true;
  }, [myUser, friends, fetchFriends]);

  // ── Remove friend ─────────────────────────────────────────────────────────────
  const removeFriend = useCallback(async (friendId) => {
    if (!myUser) return;
    await supabase
      .from('squad_friends')
      .delete()
      .eq('owner_id', myUser.id)
      .eq('friend_id', friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }, [myUser]);

  return {
    myUser,
    friends,
    loading,
    error,
    setError,
    register,
    generateInviteCode,
    addFriendWithCode,
    removeFriend,
    refetch: fetchFriends,
  };
}