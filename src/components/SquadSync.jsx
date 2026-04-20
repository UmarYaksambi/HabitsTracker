import { useState, useEffect, useCallback } from 'react';
import { X, Users, UserPlus, Copy, Check, RefreshCw, Flame, Trophy } from 'lucide-react';
import { toDateString } from '../utils/date';

// ── Tiny persistent store using localStorage for squad data ──────────────────
// In a real app this would be a backend. Here we simulate with shareable JSON codes.

function encodeProfile(habits, logs) {
  const today = toDateString(new Date());
  const todayLogs = logs.filter((l) => l.date === today && l.completed);
  const todayDone = todayLogs.length;
  const payload = {
    habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color })),
    todayDone,
    todayTotal: habits.length,
    updatedAt: new Date().toISOString(),
  };
  return btoa(JSON.stringify(payload));
}

function decodeProfile(code) {
  try {
    return JSON.parse(atob(code.trim()));
  } catch {
    return null;
  }
}

function loadSquad() {
  try {
    return JSON.parse(localStorage.getItem('squad_friends') || '[]');
  } catch {
    return [];
  }
}

function saveSquad(friends) {
  localStorage.setItem('squad_friends', JSON.stringify(friends));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FriendCard({ friend, onRemove }) {
  const pct = friend.todayTotal > 0
    ? Math.round((friend.todayDone / friend.todayTotal) * 100)
    : 0;

  const allDone = friend.todayDone === friend.todayTotal && friend.todayTotal > 0;
  const updatedMins = Math.round((Date.now() - new Date(friend.updatedAt)) / 60000);
  const timeAgo = updatedMins < 1 ? 'just now' : updatedMins < 60 ? `${updatedMins}m ago` : `${Math.round(updatedMins / 60)}h ago`;

  return (
    <div className={`relative bg-bg-muted border rounded-2xl p-4 transition-all ${allDone ? 'border-green-500/40' : 'border-bg-border'}`}>
      {allDone && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: 'linear-gradient(to right, #22c55e, #10b981)' }} />
      )}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: allDone ? 'rgba(34,197,94,0.15)' : 'rgba(124,92,252,0.15)' }}>
            {friend.avatar || '👤'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{friend.name}</p>
            <p className="text-[10px] text-text-faint">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && <Trophy size={14} className="text-amber-400" />}
          <p className="font-syne font-bold text-lg text-white">{pct}%</p>
          <button onClick={() => onRemove(friend.id)}
            className="text-text-faint hover:text-red-400 transition-colors ml-1">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-bg-border rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(to right, #22c55e, #10b981)'
              : 'linear-gradient(to right, #7c5cfc, #a08aff)',
          }} />
      </div>

      {/* Today's habits */}
      <div className="flex flex-wrap gap-1.5">
        {friend.habits.slice(0, 8).map((h) => {
          const done = friend.todayDone > 0; // simplified: we track total not per-habit for privacy
          return (
            <span key={h.id}
              className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-muted">
              {h.emoji} {h.name}
            </span>
          );
        })}
        {friend.habits.length > 8 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-card border border-bg-border text-text-faint">
            +{friend.habits.length - 8} more
          </span>
        )}
      </div>

      <p className="text-[10px] text-text-faint mt-2">
        {friend.todayDone} / {friend.todayTotal} habits today
        {allDone && ' 🎉'}
      </p>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function SquadSync({ habits, logs, onClose }) {
  const [friends, setFriends] = useState(loadSquad);
  const [tab, setTab] = useState('squad'); // 'squad' | 'add' | 'share'
  const [addCode, setAddCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addAvatar, setAddAvatar] = useState('👤');
  const [addError, setAddError] = useState('');
  const [copied, setCopied] = useState(false);

  const myCode = encodeProfile(habits, logs);

  const handleAdd = () => {
    if (!addCode.trim()) { setAddError('Paste a share code first.'); return; }
    const profile = decodeProfile(addCode);
    if (!profile) { setAddError('Invalid code. Ask your friend to share again.'); return; }
    if (!addName.trim()) { setAddError('Give this friend a nickname.'); return; }
    const newFriend = {
      id: Date.now(),
      name: addName.trim(),
      avatar: addAvatar,
      ...profile,
    };
    const updated = [...friends, newFriend];
    setFriends(updated);
    saveSquad(updated);
    setAddCode('');
    setAddName('');
    setAddError('');
    setTab('squad');
  };

  const handleRemove = useCallback((id) => {
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    saveSquad(updated);
  }, [friends]);

  const copyCode = () => {
    navigator.clipboard.writeText(myCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const AVATARS = ['👤', '🦊', '🐼', '🦁', '🐸', '🦋', '🐙', '🦄', '🔥', '⚡'];

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
                {friends.length === 0 ? 'No squad yet' : `${friends.length} friend${friends.length > 1 ? 's' : ''} synced`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-bg-border flex-shrink-0">
          {[
            { id: 'squad', label: 'My Squad' },
            { id: 'add', label: 'Add Friend' },
            { id: 'share', label: 'My Code' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Squad tab */}
          {tab === 'squad' && (
            <div className="flex flex-col gap-3">
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🫂</div>
                  <p className="font-syne font-bold text-white mb-1">No squad yet</p>
                  <p className="text-sm text-text-muted mb-4">Add friends to see their daily progress here</p>
                  <button
                    onClick={() => setTab('add')}
                    className="px-4 py-2 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors font-syne font-bold"
                  >
                    Add your first friend
                  </button>
                </div>
              ) : (
                friends.map((f) => (
                  <FriendCard key={f.id} friend={f} onRemove={handleRemove} />
                ))
              )}
            </div>
          )}

          {/* Add friend tab */}
          {tab === 'add' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">
                Ask your friend to share their code from the <span className="text-white font-medium">My Code</span> tab, then paste it below.
              </p>

              <div>
                <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">
                  Friend's Share Code
                </label>
                <textarea
                  value={addCode}
                  onChange={(e) => { setAddCode(e.target.value); setAddError(''); }}
                  placeholder="Paste code here…"
                  rows={3}
                  className="w-full bg-bg-muted border border-bg-border rounded-xl px-3 py-2 text-xs text-white placeholder-text-faint outline-none focus:border-accent transition-colors font-mono resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">
                  Nickname
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="E.g. Alex, Mom, The Boss…"
                  className="w-full bg-bg-muted border border-bg-border rounded-xl px-3 py-2 text-sm text-white placeholder-text-faint outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-faint uppercase tracking-widest mb-1.5 block">
                  Avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAddAvatar(a)}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                        addAvatar === a ? 'bg-accent/25 scale-110 ring-2 ring-accent/40' : 'bg-bg-muted hover:bg-bg-border'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {addError && (
                <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{addError}</p>
              )}

              <button
                onClick={handleAdd}
                className="w-full py-2.5 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors font-syne font-bold"
              >
                Add to Squad
              </button>
            </div>
          )}

          {/* My Code tab */}
          {tab === 'share' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted leading-relaxed">
                Share this code with friends. They'll paste it in their <span className="text-white font-medium">Add Friend</span> tab to see your daily progress.
              </p>

              <div className="bg-bg-muted border border-bg-border rounded-xl p-3">
                <p className="text-[9px] text-text-faint uppercase tracking-widest mb-2">Your Share Code</p>
                <p className="text-[10px] font-mono text-text-muted break-all leading-relaxed line-clamp-4">
                  {myCode}
                </p>
              </div>

              <button
                onClick={copyCode}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-accent text-white hover:bg-accent-hover'
                }`}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400/80 leading-relaxed">
                💡 Your code only shares habit names and today's completion count — no personal data.
                Re-share your code whenever you want friends to see updated info.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}