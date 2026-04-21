import { useState } from 'react';
import {
  X, Users, UserPlus, Trophy, RefreshCw, CheckCircle2,
  Loader2, Copy, Check, Key, Shield, LogIn, LogOut,
  ChevronLeft, Eye, Flame, Trash2, AlertTriangle,
} from 'lucide-react';
import { useSquad } from '../hooks/useSquad';
import { useAuth } from '../hooks/useAuth';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

// ── FriendHabitViewer ─────────────────────────────────────────────────────────
function FriendHabitViewer({ friend, onBack }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const habits = friend.habits || [];
  const logs   = friend.logs   || [];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days    = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDow = new Date(year, month, 1).getDay();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOW    = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const isCompleted = (habitId, day) => {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
  };

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const pct = friend.today_total > 0 ? Math.round((friend.today_done / friend.today_total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-bg-border flex-shrink-0">
        <button onClick={onBack} className="text-text-faint hover:text-white transition-colors p-1">
          <ChevronLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center font-syne font-bold text-sm text-accent">
          {friend.username.slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">@{friend.username}</p>
          <p className="text-[10px] text-text-faint">
            {pct}% today · {friend.top_streak ?? 0}🔥 · updated {timeAgo(friend.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-text-muted hover:text-white transition-colors">
            <ChevronLeft size={12} />
          </button>
          <span className="text-xs font-syne font-bold text-white w-16 text-center">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-text-muted hover:text-white transition-colors rotate-180">
            <ChevronLeft size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {habits.length === 0 ? (
          <div className="text-center py-12 text-text-faint text-sm">No habits to show.</div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const completedCount = days.filter(d => isCompleted(habit.id, d)).length;
              const habitPct = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0;
              return (
                <div key={habit.id} className="bg-bg-muted border border-bg-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-sm font-medium text-white">{habit.name}</span>
                    </div>
                    <span className="text-xs font-syne font-bold text-text-muted">{habitPct}%</span>
                  </div>
                  <div className="grid grid-cols-7 gap-px mb-1">
                    {DOW.map(d => <div key={d} className="text-center text-[8px] text-text-faint py-0.5">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
                    {days.map(day => {
                      const done = isCompleted(habit.id, day);
                      const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
                      return (
                        <div key={day}
                          className={['aspect-square rounded flex items-center justify-center text-[9px] font-medium',
                            done ? 'text-white' : isToday ? 'border border-accent/40 text-accent' : 'text-text-faint',
                          ].join(' ')}
                          style={done ? { background: habit.color || '#7c5cfc' } : {}}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GoogleSignInButton ────────────────────────────────────────────────────────
function GoogleSignInButton({ session, signInWithGoogle, signOut }) {
  const [signingIn, setSigningIn] = useState(false);

  if (session) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center gap-2">
          {session.user?.user_metadata?.avatar_url && (
            <img src={session.user.user_metadata.avatar_url} className="w-6 h-6 rounded-full" alt="" />
          )}
          <div>
            <p className="text-xs font-medium text-white">{session.user?.user_metadata?.full_name || session.user?.email}</p>
            <p className="text-[10px] text-green-400">Google account linked ✓</p>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-1 text-[11px] text-text-faint hover:text-red-400 transition-colors">
          <LogOut size={12} /> Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-bg-muted border border-bg-border rounded-xl">
      <div>
        <p className="text-xs font-medium text-white">Sync across devices</p>
        <p className="text-[10px] text-text-faint">Sign in with Google to access your InnerCircle on any device</p>
      </div>
      <button
        onClick={async () => { setSigningIn(true); await signInWithGoogle(); setSigningIn(false); }}
        disabled={signingIn}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-3"
      >
        {signingIn ? <Loader2 size={12} className="animate-spin" /> : (
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {signingIn ? 'Redirecting…' : 'Google'}
      </button>
    </div>
  );
}

// ── FriendCard ────────────────────────────────────────────────────────────────
function FriendCard({ friend, onRemove, onView }) {
  const pct     = friend.today_total > 0 ? Math.round((friend.today_done / friend.today_total) * 100) : 0;
  const allDone = friend.today_done === friend.today_total && friend.today_total > 0;

  return (
    <div className={`relative bg-bg-muted border rounded-2xl p-4 transition-all ${allDone ? 'border-green-500/40' : 'border-bg-border'}`}>
      {allDone && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: 'linear-gradient(to right,#22c55e,#10b981)' }} />
      )}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-syne font-bold text-sm ${allDone ? 'bg-green-500/15 text-green-400' : 'bg-accent/15 text-accent'}`}>
            {friend.username.slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">@{friend.username}</p>
            <p className="text-[10px] text-text-faint">Updated {timeAgo(friend.updated_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {allDone && <Trophy size={14} className="text-amber-400" />}
          <span className="font-syne font-bold text-lg text-white">{pct}%</span>
          <button onClick={() => onView(friend)} className="text-text-faint hover:text-violet-400 transition-colors p-1" title="View full tracker">
            <Eye size={13} />
          </button>
          <button onClick={() => onRemove(friend.id)} className="text-text-faint hover:text-red-400 transition-colors p-1" title="Remove">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-bg-border rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(to right,#22c55e,#10b981)' : 'linear-gradient(to right,#7c5cfc,#a08aff)' }} />
      </div>

      <div className="flex gap-3 mb-3">
        <div className="flex items-center gap-1 text-[10px] text-text-faint">
          <Flame size={10} className="text-amber-400" />
          <span>{friend.top_streak ?? 0} streak</span>
        </div>
        <div className="text-[10px] text-text-faint">📅 {friend.monthly_pct ?? 0}% this month</div>
        <div className="text-[10px] text-text-faint">✓ {friend.total_checkins ?? 0} total</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(friend.habits || []).slice(0,6).map(h => (
          <span key={h.id} className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-muted">
            {h.emoji} {h.name}
          </span>
        ))}
        {(friend.habits || []).length > 6 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-faint">
            +{friend.habits.length - 6} more
          </span>
        )}
      </div>
      <p className="text-[10px] text-text-faint mt-2">
        {friend.today_done}/{friend.today_total} habits today{allDone && ' 🎉'}
      </p>
    </div>
  );
}

// ── RegisterView ──────────────────────────────────────────────────────────────
function RegisterView({ onRegister, error, setError, session, signInWithGoogle, signOut }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (username.length < 3) return;
    setBusy(true);
    await onRegister(username);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      <GoogleSignInButton session={session} signInWithGoogle={signInWithGoogle} signOut={signOut} />

      <div className="text-center">
        <div className="text-4xl mb-3">🫂</div>
        <h3 className="font-syne font-bold text-white text-base mb-1">Pick your InnerCircle username</h3>
        <p className="text-sm text-text-muted">
          Friends need your username + a code to add you.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 focus-within:border-accent transition-colors">
        <span className="text-text-faint text-sm">@</span>
        <input autoFocus type="text" value={username}
          onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')); setError(''); }}
          onKeyDown={e => e.key==='Enter' && submit()}
          placeholder="your_username" maxLength={20}
          className="flex-1 bg-transparent text-sm text-white placeholder-text-faint outline-none" />
        <span className="text-[10px] text-text-faint">{username.length}/20</span>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={submit} disabled={username.length < 3 || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold transition-all ${
          username.length >= 3 && !busy ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-bg-border text-text-faint cursor-not-allowed'
        }`}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        {busy ? 'Claiming…' : 'Claim Username'}
      </button>
    </div>
  );
}

// ── InviteCodePanel ───────────────────────────────────────────────────────────
function InviteCodePanel({ generateInviteCode, myUser }) {
  const [code, setCode]         = useState(null);
  const [generating, setGen]    = useState(false);
  const [copied, setCopied]     = useState(false);
  const [copyFailed, setFailed] = useState(false);

  const handleGenerate = async () => {
    setGen(true);
    const c = await generateInviteCode();
    setCode(c); setGen(false); setCopied(false);
  };

  const handleCopy = async () => {
    if (!code) return;
    const text = `Add me on Habit Tracker!\nUsername: @${myUser.username}\nInvite code: ${code}\n(single-use, 24h)`;
    const ok = await copyText(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
    else { setFailed(true); setTimeout(() => setFailed(false), 3000); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex gap-3">
        <Shield size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-violet-300 leading-relaxed">
          Generate a one-time code. Your friend enters your username + this code to add you. Works once, expires in 24h.
        </p>
      </div>

      {code ? (
        <div className="bg-bg-muted border border-bg-border rounded-2xl p-5 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-widest mb-2">Your Invite Code</p>
          <p className="font-syne font-extrabold text-3xl text-white tracking-widest mb-1 select-all">{code}</p>
          <p className="text-[10px] text-text-faint mb-4">Single-use · Expires in 24 hours</p>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-syne font-bold transition-all ${
                copied ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : copyFailed ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-accent text-white hover:bg-accent-hover'
              }`}>
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              {copied ? 'Copied!' : copyFailed ? 'Failed — select manually' : 'Copy to Share'}
            </button>
            <button onClick={handleGenerate} disabled={generating}
              className="px-3 py-2 rounded-xl text-xs text-text-muted border border-bg-border hover:text-white hover:border-accent transition-colors">
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            </button>
          </div>
          {copyFailed && (
            <p className="text-[10px] text-text-faint mt-3 bg-bg-card rounded-lg p-2 font-mono select-all break-all">
              @{myUser.username} · {code}
            </p>
          )}
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-xl text-sm font-syne font-bold hover:bg-accent-hover transition-colors">
          {generating ? <Loader2 size={15} className="animate-spin"/> : <Key size={15}/>}
          {generating ? 'Generating…' : 'Generate Invite Code'}
        </button>
      )}

      <p className="text-[11px] text-text-faint text-center">
        Your username: <span className="text-white font-medium select-all">@{myUser?.username}</span>
      </p>
    </div>
  );
}

// ── AddFriendView ─────────────────────────────────────────────────────────────
function AddFriendView({ addFriendWithCode, error, setError }) {
  const [username, setUsername] = useState('');
  const [code, setCode]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [success, setSuccess]   = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    const ok = await addFriendWithCode(username, code);
    setBusy(false);
    if (ok) { setSuccess(true); setUsername(''); setCode(''); }
  };

  const ready = username.trim().length >= 3 && code.trim().length >= 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bg-muted border border-bg-border rounded-xl p-3 flex gap-3">
        <Key size={14} className="text-text-faint flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          Ask your friend for their username + an invite code from their <span className="text-white font-medium">Invite Code</span> tab.
        </p>
      </div>

      {error   && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2 flex items-center gap-2"><CheckCircle2 size={13}/> Added to your InnerCircle!</p>}

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">Friend's Username</label>
          <div className="flex items-center gap-2 bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 focus-within:border-accent transition-colors">
            <span className="text-text-faint text-sm">@</span>
            <input type="text" value={username}
              onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')); setError(''); }}
              placeholder="their_username" maxLength={20}
              className="flex-1 bg-transparent text-sm text-white placeholder-text-faint outline-none" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">Their Invite Code</label>
          <input type="text" value={code}
            onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')); setError(''); }}
            placeholder="HAWK-4921" maxLength={9}
            className="w-full bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-faint outline-none focus:border-accent transition-colors font-mono tracking-widest" />
        </div>
      </div>

      <button onClick={handleAdd} disabled={!ready || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold transition-all ${
          ready && !busy ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-bg-border text-text-faint cursor-not-allowed'
        }`}>
        {busy ? <Loader2 size={15} className="animate-spin"/> : <UserPlus size={15}/>}
        {busy ? 'Adding…' : 'Add to InnerCircle'}
      </button>
    </div>
  );
}

// ── AccountView ───────────────────────────────────────────────────────────────
function AccountView({ session, signInWithGoogle, signOut, myUser, deleteAccount }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteAccount();
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Google auth panel */}
      <GoogleSignInButton session={session} signInWithGoogle={signInWithGoogle} signOut={signOut} />

      {/* Username */}
      <div className="bg-bg-muted border border-bg-border rounded-xl p-3">
        <p className="text-[10px] text-text-faint uppercase tracking-widest mb-1">Your InnerCircle Username</p>
        <p className="text-white font-syne font-bold text-lg select-all">@{myUser?.username}</p>
        <p className="text-[10px] text-text-faint mt-1">This is how friends find and add you.</p>
      </div>

      {/* How sync works */}
      {!session && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            Without Google sign-in, your InnerCircle account is tied to this browser only.
            Sign in with Google to access it from any device.
          </p>
        </div>
      )}

      {/* Delete account */}
      {!confirming ? (
        <button onClick={() => setConfirming(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors">
          <Trash2 size={13} /> Delete InnerCircle Account
        </button>
      ) : (
        <div className="border border-red-500/30 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm text-white font-medium">Delete your InnerCircle account?</p>
          <p className="text-xs text-text-muted">This removes your profile, all friends, and invite codes. Your local habit data is unaffected.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-lg border border-bg-border text-text-muted text-xs hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SquadSync({ habits, logs, authUser, onClose }) {
  const { session, signInWithGoogle, signOut } = useAuth();

  // SquadSync owns the single useSquad instance
  const {
    myUser, friends, loading, error, setError,
    register, generateInviteCode, addFriendWithCode, removeFriend, deleteAccount, refetch,
  } = useSquad(habits, logs, authUser);

  const [tab,        setTab]    = useState('squad');
  const [refreshing, setRefresh]= useState(false);
  const [viewing,    setViewing]= useState(null);

  const handleRefresh = async () => {
    setRefresh(true);
    await refetch();
    setRefresh(false);
  };

  const tabs = myUser ? [
    { id: 'squad',   label: 'My InnerCircle'  },
    { id: 'add',     label: 'Add Friend'  },
    { id: 'invite',  label: 'Invite Code' },
    { id: 'account', label: 'Account'     },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-bg-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {!viewing && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-bg-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Users size={18} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="font-syne font-bold text-white text-base">InnerCircle</h2>
                  <p className="text-[11px] text-text-muted">
                    {myUser
                      ? `@${myUser.username} · ${friends.length} friend${friends.length !== 1 ? 's' : ''}`
                      : 'Live habit accountability'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {myUser && (
                  <button onClick={handleRefresh} className="text-text-faint hover:text-white transition-colors p-1.5">
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                )}
                <button onClick={onClose} className="text-text-faint hover:text-white transition-colors p-1.5">
                  <X size={18} />
                </button>
              </div>
            </div>

            {myUser && (
              <div className="flex border-b border-bg-border flex-shrink-0">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setError(''); }}
                    className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
                      tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-white'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex-1 overflow-y-auto">
          {viewing ? (
            <FriendHabitViewer friend={viewing} onBack={() => setViewing(null)} />
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : !myUser ? (
            <div className="p-4">
              <RegisterView
                onRegister={register} error={error} setError={setError}
                session={session} signInWithGoogle={signInWithGoogle} signOut={signOut}
              />
            </div>
          ) : tab === 'squad' ? (
            <div className="flex flex-col gap-3 p-4">
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🫂</div>
                  <p className="font-syne font-bold text-white mb-1">No InnerCircle yet</p>
                  <p className="text-sm text-text-muted mb-4">Share your invite code or enter a friend's.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setTab('invite')}
                      className="px-4 py-2 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors font-syne font-bold">
                      Get Invite Code
                    </button>
                    <button onClick={() => setTab('add')}
                      className="px-4 py-2 border border-bg-border text-text-muted text-sm rounded-xl hover:text-white hover:border-accent transition-colors">
                      Add Friend
                    </button>
                  </div>
                </div>
              ) : friends.map(f => (
                <FriendCard key={f.id} friend={f} onRemove={removeFriend} onView={setViewing} />
              ))}
            </div>
          ) : tab === 'add' ? (
            <div className="p-4">
              <AddFriendView addFriendWithCode={addFriendWithCode} error={error} setError={setError} />
            </div>
          ) : tab === 'invite' ? (
            <div className="p-4">
              <InviteCodePanel generateInviteCode={generateInviteCode} myUser={myUser} />
            </div>
          ) : (
            <div className="p-4">
              <AccountView
                session={session} signInWithGoogle={signInWithGoogle} signOut={signOut}
                myUser={myUser} deleteAccount={deleteAccount}
              />
            </div>
          )}
        </div>

        {!viewing && myUser && (
          <div className="px-5 py-3 border-t border-bg-border flex-shrink-0">
            <p className="text-[10px] text-text-faint text-center">
              Invite-only · Syncs every 30s · Only habits & stats shared with InnerCircle
            </p>
          </div>
        )}
      </div>
    </div>
  );
}