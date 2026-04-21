/**
 * useSquad.js — rewritten
 *
 * Key fixes:
 * 1. Single source of truth: useSquad is called ONCE (in SquadSync), NOT in App.
 *    App gets `friends` via a lightweight `useSquadFriends` hook that reads from
 *    a shared Zustand store instead of hitting Supabase again.
 * 2. Google auth linking is handled correctly: when a user signs in with Google
 *    we upsert by auth_id so the same squad record is always found.
 * 3. pushMyProfile is debounced and only fires when a squad user exists.
 * 4. Register auto-links the Google auth_id at creation time.
 */

import { useState, useEffect, useCallback, useRef, create } from 'react';
import { supabase } from '../db/supabase';
import { toDateString } from '../utils/date';
import { calculateStreak } from '../domain/streaks';
import { getMonthlyCompletion, getTotalCheckIns } from '../domain/stats';

// ─── localStorage key ────────────────────────────────────────────────────────
const LOCAL_USER_KEY = 'squad_my_user_id';
const getStoredUserId = () => localStorage.getItem(LOCAL_USER_KEY);
const storeUserId     = (id) => localStorage.setItem(LOCAL_USER_KEY, id);
const clearStoredUserId = () => localStorage.removeItem(LOCAL_USER_KEY);

// ─── Invite code generator ───────────────────────────────────────────────────
function generateCode() {
  const words = ['HAWK', 'WOLF', 'BEAR', 'LYNX', 'FOX', 'BULL', 'KITE', 'STAG', 'CROW', 'SEAL'];
  const word  = words[Math.floor(Math.random() * words.length)];
  const num   = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// ─── Build the profile payload ───────────────────────────────────────────────
function buildProfilePayload(habits, logs) {
  const today    = toDateString(new Date());
  const now      = new Date();
  const todayDone      = logs.filter(l => l.date === today && l.completed).length;
  const totalCheckins  = getTotalCheckIns(logs);
  const monthlyPct     = getMonthlyCompletion(habits, logs, now.getFullYear(), now.getMonth());
  const topStreak      = habits.reduce((best, h) => {
    const s = calculateStreak(h.id, logs);
    return s > best ? s : best;
  }, 0);

  return {
    habits:          habits.map(h => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color })),
    logs:            logs.map(l => ({ habitId: l.habitId, date: l.date, completed: l.completed })),
    today_done:      todayDone,
    today_total:     habits.length,
    monthly_pct:     monthlyPct,
    top_streak:      topStreak,
    total_checkins:  totalCheckins,
    updated_at:      new Date().toISOString(),
  };
}

// ─── Resolve squad user from auth or localStorage ────────────────────────────
// Returns { id, username } or null.
async function resolveSquadUser(authUser) {
  // 1. Google user → look up by auth_id first
  if (authUser) {
    const { data: byAuth } = await supabase
      .from('squad_users')
      .select('id, username')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (byAuth) {
      storeUserId(byAuth.id);
      return byAuth;
    }

    // 2. Google user but no squad record by auth_id yet — check localStorage
    const localId = getStoredUserId();
    if (localId) {
      const { data: localUser } = await supabase
        .from('squad_users')
        .select('id, username')
        .eq('id', localId)
        .maybeSingle();

      if (localUser) {
        // Link existing local record to this Google account
        await supabase
          .from('squad_users')
          .update({ auth_id: authUser.id })
          .eq('id', localId);
        return localUser;
      }
    }
    // Google user with no squad record at all — needs registration
    return null;
  }

  // 3. Not logged in — try localStorage
  const localId = getStoredUserId();
  if (!localId) return null;

  const { data } = await supabase
    .from('squad_users')
    .select('id, username')
    .eq('id', localId)
    .maybeSingle();

  return data ?? null;
}

// ─── Main hook ───────────────────────────────────────────────────────────────
export function useSquad(habits, logs, authUser) {
  const [myUser,  setMyUser]  = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const pollRef    = useRef(null);
  const pushTimer  = useRef(null);
  const myUserRef  = useRef(null);
  myUserRef.current = myUser;

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const resolved = await resolveSquadUser(authUser);
      if (!cancelled) {
        setMyUser(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]); // re-run when Google user changes

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myUser) return;
    fetchFriends();
    pollRef.current = setInterval(fetchFriends, 30_000);
    return () => clearInterval(pollRef.current);
  }, [myUser?.id]);

  // ── Push profile (debounced 2 s) ──────────────────────────────────────────
  useEffect(() => {
    if (!myUser) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      await supabase
        .from('squad_users')
        .update(buildProfilePayload(habits, logs))
        .eq('id', myUser.id);
    }, 2000);
    return () => clearTimeout(pushTimer.current);
  }, [habits, logs, myUser?.id]);

  // ── Fetch friends ─────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    const user = myUserRef.current;
    if (!user) return;

    const { data: links } = await supabase
      .from('squad_friends')
      .select('friend_id')
      .eq('owner_id', user.id);

    if (!links?.length) { setFriends([]); return; }

    const ids = links.map(l => l.friend_id);
    const { data: users } = await supabase
      .from('squad_users')
      .select('id, username, habits, logs, today_done, today_total, monthly_pct, top_streak, total_checkins, updated_at')
      .in('id', ids);

    if (users) setFriends(users);
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (username) => {
    setError('');
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) { setError('Must be at least 3 chars (a–z, 0–9, _)'); return false; }

    const { data: existing } = await supabase
      .from('squad_users')
      .select('id')
      .eq('username', clean)
      .maybeSingle();
    if (existing) { setError('Username already taken.'); return false; }

    const { data, error: err } = await supabase
      .from('squad_users')
      .insert({
        username:    clean,
        auth_id:     authUser?.id ?? null, // link Google ID at creation if available
        ...buildProfilePayload(habits, logs),
      })
      .select('id, username')
      .single();

    if (err || !data) { setError('Something went wrong. Try again.'); return false; }

    storeUserId(data.id);
    setMyUser({ id: data.id, username: data.username });
    return true;
  }, [habits, logs, authUser?.id]);

  // ── Generate invite code ──────────────────────────────────────────────────
  const generateInviteCode = useCallback(async () => {
    if (!myUser) return null;
    for (let i = 0; i < 5; i++) {
      const code = generateCode();
      const { data, error: err } = await supabase
        .from('squad_invite_codes')
        .insert({ owner_id: myUser.id, code })
        .select()
        .single();
      if (!err && data) return code;
    }
    return null;
  }, [myUser?.id]);

  // ── Add friend with invite code ───────────────────────────────────────────
  const addFriendWithCode = useCallback(async (username, inviteCode) => {
    setError('');
    if (!myUser) return false;

    const cleanUser = username.trim().toLowerCase();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanUser) { setError('Enter a username.'); return false; }
    if (!cleanCode) { setError('Enter the invite code.'); return false; }

    const { data: target } = await supabase
      .from('squad_users')
      .select('id, username, habits, logs, today_done, today_total, monthly_pct, top_streak, total_checkins, updated_at')
      .eq('username', cleanUser)
      .maybeSingle();

    if (!target)                  { setError('No user found with that username.'); return false; }
    if (target.id === myUser.id)  { setError("You can't add yourself."); return false; }
    if (friends.some(f => f.id === target.id)) { setError('Already in your squad.'); return false; }

    const { data: codeRow } = await supabase
      .from('squad_invite_codes')
      .select('id, used, expires_at')
      .eq('owner_id', target.id)
      .eq('code', cleanCode)
      .maybeSingle();

    if (!codeRow)                                   { setError('Invalid code.'); return false; }
    if (codeRow.used)                               { setError('Code already used.'); return false; }
    if (new Date(codeRow.expires_at) < new Date())  { setError('Code expired. Ask for a new one.'); return false; }

    await supabase.from('squad_invite_codes').update({ used: true }).eq('id', codeRow.id);
    const { error: insertErr } = await supabase
      .from('squad_friends')
      .insert({ owner_id: myUser.id, friend_id: target.id });

    if (insertErr) { setError('Could not add friend.'); return false; }
    await fetchFriends();
    return true;
  }, [myUser, friends, fetchFriends]);

  // ── Remove friend ─────────────────────────────────────────────────────────
  const removeFriend = useCallback(async (friendId) => {
    if (!myUser) return;
    await supabase.from('squad_friends').delete()
      .eq('owner_id', myUser.id).eq('friend_id', friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
  }, [myUser?.id]);

  // ── Delete account ────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    if (!myUser) return false;
    await supabase.from('squad_friends').delete().eq('owner_id', myUser.id);
    await supabase.from('squad_invite_codes').delete().eq('owner_id', myUser.id);
    await supabase.from('squad_users').delete().eq('id', myUser.id);
    clearStoredUserId();
    setMyUser(null);
    setFriends([]);
    return true;
  }, [myUser?.id]);

  return {
    myUser, friends, loading, error, setError,
    register, generateInviteCode, addFriendWithCode, removeFriend, deleteAccount,
    refetch: fetchFriends,
  };
}