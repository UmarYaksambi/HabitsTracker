import { useState } from 'react';
import {
  X, Users, UserPlus, Trophy, RefreshCw,
  CheckCircle2, Loader2, Copy, Check, Key, Shield,
} from 'lucide-react';
import { useSquad } from '../hooks/useSquad';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoString) {
  const mins = Math.round((Date.now() - new Date(isoString)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

// ── FriendCard ────────────────────────────────────────────────────────────────

function FriendCard({ friend, onRemove }) {
  const pct = friend.today_total > 0
    ? Math.round((friend.today_done / friend.today_total) * 100) : 0;
  const allDone = friend.today_done === friend.today_total && friend.today_total > 0;

  return (
    <div className={`relative bg-bg-muted border rounded-2xl p-4 transition-all ${allDone ? 'border-green-500/40' : 'border-bg-border'}`}>
      {allDone && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: 'linear-gradient(to right, #22c55e, #10b981)' }} />
      )}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-syne font-bold text-sm ${allDone ? 'bg-green-500/15 text-green-400' : 'bg-accent/15 text-accent'}`}>
            {friend.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">@{friend.username}</p>
            <p className="text-[10px] text-text-faint">Updated {timeAgo(friend.updated_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && <Trophy size={14} className="text-amber-400" />}
          <span className="font-syne font-bold text-lg text-white">{pct}%</span>
          <button onClick={() => onRemove(friend.id)}
            className="text-text-faint hover:text-red-400 transition-colors ml-1 p-1">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-bg-border rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(to right, #22c55e, #10b981)'
              : 'linear-gradient(to right, #7c5cfc, #a08aff)',
          }} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {(friend.habits || []).slice(0, 6).map((h) => (
          <span key={h.id}
            className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-muted">
            {h.emoji} {h.name}
          </span>
        ))}
        {(friend.habits || []).length > 6 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-faint">
            +{friend.habits.length - 6} more
          </span>
        )}
      </div>

      <p className="text-[10px] text-text-faint">
        {friend.today_done} / {friend.today_total} habits today{allDone && ' 🎉'}
      </p>
    </div>
  );
}

// ── RegisterView ──────────────────────────────────────────────────────────────

function RegisterView({ onRegister, error, setError }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (username.length < 3) return;
    setBusy(true);
    await onRegister(username);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="text-center">
        <div className="text-4xl mb-3">🫂</div>
        <h3 className="font-syne font-bold text-white text-base mb-1">Pick your username</h3>
        <p className="text-sm text-text-muted">
          Friends will need your username + an invite code you generate to add you. Letters, numbers and underscores only.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 focus-within:border-accent transition-colors">
        <span className="text-text-faint text-sm">@</span>
        <input
          autoFocus
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="your_username"
          maxLength={20}
          className="flex-1 bg-transparent text-sm text-white placeholder-text-faint outline-none"
        />
        <span className="text-[10px] text-text-faint">{username.length}/20</span>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={submit}
        disabled={username.length < 3 || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold transition-all ${
          username.length >= 3 && !busy
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'bg-bg-border text-text-faint cursor-not-allowed'
        }`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        {busy ? 'Claiming…' : 'Claim Username'}
      </button>
    </div>
  );
}

// ── InviteCodePanel ───────────────────────────────────────────────────────────
// Shown in the "My Code" tab — generate a single-use code to share with a friend

function InviteCodePanel({ generateInviteCode, myUser }) {
  const [code, setCode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const newCode = await generateInviteCode();
    setCode(newCode);
    setGenerating(false);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!code) return;
    const text = `Hey! Add me on Habit Tracker Squad Sync.\nUsername: @${myUser.username}\nInvite code: ${code}\n(Single-use, expires in 24h)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex gap-3">
        <Shield size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-violet-300 leading-relaxed">
          Generate a one-time code and share it with your friend. They'll enter your username + this code to add you. Each code works once and expires in 24 hours.
        </p>
      </div>

      {code ? (
        <div className="bg-bg-muted border border-bg-border rounded-2xl p-5 text-center">
          <p className="text-[10px] text-text-faint uppercase tracking-widest mb-2">Your Invite Code</p>
          <p className="font-syne font-extrabold text-3xl text-white tracking-widest mb-1">{code}</p>
          <p className="text-[10px] text-text-faint mb-4">Single-use · Expires in 24 hours</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-syne font-bold transition-all ${
                copied
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-accent text-white hover:bg-accent-hover'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy to Share'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-2 rounded-xl text-xs text-text-muted border border-bg-border hover:text-white hover:border-bg-border/80 transition-colors"
              title="Generate a new code"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-xl text-sm font-syne font-bold hover:bg-accent-hover transition-colors"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
          {generating ? 'Generating…' : 'Generate Invite Code'}
        </button>
      )}

      <div className="text-center">
        <p className="text-[11px] text-text-faint">Your username: <span className="text-white font-medium">@{myUser?.username}</span></p>
        <p className="text-[10px] text-text-faint mt-0.5">Share both your username and the code with your friend</p>
      </div>
    </div>
  );
}

// ── AddFriendView ─────────────────────────────────────────────────────────────

function AddFriendView({ addFriendWithCode, error, setError }) {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    const ok = await addFriendWithCode(username, code);
    setBusy(false);
    if (ok) {
      setSuccess(true);
      setUsername('');
      setCode('');
    }
  };

  const ready = username.trim().length >= 3 && code.trim().length >= 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bg-muted border border-bg-border rounded-xl p-3 flex gap-3">
        <Key size={14} className="text-text-faint flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          Ask your friend to generate an invite code from their <span className="text-white font-medium">Invite Code</span> tab, then enter their username and that code below.
        </p>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

      {success && (
        <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={13} /> Added to your squad! They'll show up in My Squad.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">
            Friend's Username
          </label>
          <div className="flex items-center gap-2 bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 focus-within:border-accent transition-colors">
            <span className="text-text-faint text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(''); }}
              placeholder="their_username"
              maxLength={20}
              className="flex-1 bg-transparent text-sm text-white placeholder-text-faint outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">
            Their Invite Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setError(''); }}
            placeholder="HAWK-4921"
            maxLength={9}
            className="w-full bg-bg-muted border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-faint outline-none focus:border-accent transition-colors font-mono tracking-widest"
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!ready || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold transition-all ${
          ready && !busy
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'bg-bg-border text-text-faint cursor-not-allowed'
        }`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        {busy ? 'Adding…' : 'Add to Squad'}
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function SquadSync({ habits, logs, onClose }) {
  const {
    myUser, friends, loading, error, setError,
    register, generateInviteCode, addFriendWithCode, removeFriend, refetch,
  } = useSquad(habits, logs);

  const [tab, setTab] = useState('squad');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const tabs = myUser ? [
    { id: 'squad', label: 'My Squad' },
    { id: 'add', label: 'Add Friend' },
    { id: 'invite', label: 'Invite Code' },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-bg-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-bg-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Users size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-white text-base">Squad Sync</h2>
              <p className="text-[11px] text-text-muted">
                {myUser
                  ? `@${myUser.username} · ${friends.length} friend${friends.length !== 1 ? 's' : ''}`
                  : 'Live habit accountability'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {myUser && (
              <button onClick={handleRefresh} className="text-text-faint hover:text-white transition-colors p-1.5" title="Refresh">
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <button onClick={onClose} className="text-text-faint hover:text-white transition-colors p-1.5">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {myUser && (
          <div className="flex border-b border-bg-border flex-shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : !myUser ? (
            <RegisterView onRegister={register} error={error} setError={setError} />
          ) : tab === 'squad' ? (
            <div className="flex flex-col gap-3">
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🫂</div>
                  <p className="font-syne font-bold text-white mb-1">No squad yet</p>
                  <p className="text-sm text-text-muted mb-1">Share your invite code with a friend,</p>
                  <p className="text-sm text-text-muted mb-4">or enter theirs to add them.</p>
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
              ) : (
                friends.map((f) => <FriendCard key={f.id} friend={f} onRemove={removeFriend} />)
              )}
            </div>
          ) : tab === 'add' ? (
            <AddFriendView addFriendWithCode={addFriendWithCode} error={error} setError={setError} />
          ) : (
            <InviteCodePanel generateInviteCode={generateInviteCode} myUser={myUser} />
          )}
        </div>

        {myUser && (
          <div className="px-5 py-3 border-t border-bg-border flex-shrink-0">
            <p className="text-[10px] text-text-faint text-center">
              Invite-only · Progress syncs every 30s · Only habit names + today's count shared
            </p>
          </div>
        )}
      </div>
    </div>
  );
}