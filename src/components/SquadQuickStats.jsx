import { memo } from 'react';
import { Users, Flame, ChevronRight } from 'lucide-react';
import { calculateMutualStreak } from '../domain/streaks';

function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

function FriendChip({ friend, myHabits, myLogs, onView }) {
  const pct     = friend.today_total > 0
    ? Math.round((friend.today_done / friend.today_total) * 100)
    : 0;
  const allDone = pct === 100 && friend.today_total > 0;

  const mutualStreak = calculateMutualStreak(
    myHabits,
    myLogs,
    friend.habits || [],
    friend.logs   || []
  );

  return (
    <button
      onClick={() => onView(friend)}
      className={[
        'group flex-shrink-0 snap-start w-44 rounded-2xl border p-3 text-left',
        'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
        allDone
          ? 'bg-green-500/5 border-green-500/30 hover:border-green-400/60'
          : 'bg-bg-card border-bg-border hover:border-violet-500/40',
      ].join(' ')}
    >
      {/* Top accent line */}
      {allDone && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: 'linear-gradient(to right,#22c55e,#10b981)' }} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={[
            'w-7 h-7 rounded-lg flex items-center justify-center font-syne font-bold text-[11px] flex-shrink-0',
            allDone ? 'bg-green-500/15 text-green-400' : 'bg-accent/15 text-accent',
          ].join(' ')}>
            {friend.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate leading-none">
              @{friend.username}
            </p>
            <p className="text-[9px] text-text-faint mt-0.5 truncate">
              {timeAgo(friend.updated_at)}
            </p>
          </div>
        </div>
        <span className={[
          'font-syne font-extrabold text-sm flex-shrink-0 ml-1',
          allDone ? 'text-green-400' : 'text-white',
        ].join(' ')}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-border rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(to right,#22c55e,#10b981)'
              : 'linear-gradient(to right,#7c5cfc,#a08aff)',
          }}
        />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {(friend.top_streak ?? 0) > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
            <Flame size={9} />
            {friend.top_streak}
          </span>
        )}
        {mutualStreak >= 2 && (
          <span className="text-[10px] text-violet-400 font-medium">
            🤝{mutualStreak}
          </span>
        )}
        {allDone && (
          <span className="text-[10px]">🎉</span>
        )}
        <span className="text-[10px] text-text-faint ml-auto">
          {friend.today_done}/{friend.today_total}
        </span>
      </div>
    </button>
  );
}

function SquadQuickStats({ friends, myHabits, myLogs, onOpenSquad, onViewFriend }) {
  if (!friends?.length) return null;

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-violet-400" />
          <span className="text-[10px] font-syne font-bold text-text-muted uppercase tracking-widest">
            InnerCircle
          </span>
          <span className="text-[10px] text-text-faint">
            · {friends.length} friend{friends.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onOpenSquad}
          className="flex items-center gap-0.5 text-[11px] text-text-faint hover:text-accent transition-colors"
        >
          Manage
          <ChevronRight size={11} />
        </button>
      </div>

      {/* Scrollable card row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {friends.map((friend) => (
          <FriendChip
            key={friend.id}
            friend={friend}
            myHabits={myHabits}
            myLogs={myLogs}
            onView={onViewFriend}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(SquadQuickStats);