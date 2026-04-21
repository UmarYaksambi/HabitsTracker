import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Download, Upload, Trash2, Users } from 'lucide-react';
import { formatMonthLabel } from '../utils/date';

function ClearDataModal({ onClose, onConfirm }) {
  const [value, setValue] = useState('');
  const phrase = "I'm stupid";
  const ready = value === phrase;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-bg-card border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-white text-base">Clear All Data</h2>
            <p className="text-[11px] text-text-muted">This cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          All habits and logs will be permanently deleted. To confirm, type{' '}
          <span className="text-red-400 font-mono font-bold">{phrase}</span> below.
        </p>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Type "${phrase}"…`}
          className="w-full bg-bg-muted border border-bg-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-faint outline-none focus:border-red-500/60 transition-colors mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-bg-border text-text-muted text-sm hover:text-white hover:border-bg-border/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={ready ? onConfirm : undefined}
            disabled={!ready}
            className={`flex-1 py-2 rounded-lg text-sm font-syne font-bold transition-all ${
              ready
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-red-500/10 text-red-500/30 cursor-not-allowed'
            }`}
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header({
  year, month, onPrev, onNext, onExport, onImport, onClearData, onOpenSquad,
  maishaActive = false,
  is5amClub    = false,
}) {
  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    {
      icon: <Download size={13} />,
      label: 'Export Data',
      onClick: () => { onExport(); setMenuOpen(false); },
    },
    {
      icon: <Upload size={13} />,
      label: 'Import Data',
      onClick: () => { fileRef.current?.click(); setMenuOpen(false); },
    },
    { divider: true },
    {
      icon: <Users size={13} className="text-violet-400" />,
      label: 'InnerCircle',
      sublabel: 'View friends\' habits',
      onClick: () => { onOpenSquad(); setMenuOpen(false); },
      accent: true,
    },
    { divider: true },
    {
      icon: <Trash2 size={13} className="text-red-400" />,
      label: 'Clear All Data',
      onClick: () => { setShowClearModal(true); setMenuOpen(false); },
      danger: true,
    },
  ];

  // Resolve subtitle — MAISHA takes priority, then 5am Club, then default
  const subtitle = maishaActive
    ? 'Maisha > everything else 💖'
    : is5amClub
    ? '🌅 You didn\'t hit snooze · One quiet win'
    : 'Build the life you want — one day at a time';

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-syne text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
            Habit Tracker
          </h1>
          <p
            key={subtitle}
            className={[
              'text-xs uppercase tracking-widest mt-1.5 transition-colors duration-300 animate-fade-in',
              maishaActive
                ? 'text-violet-400'
                : is5amClub
                ? 'text-amber-400'
                : 'text-text-muted',
            ].join(' ')}
          >
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="w-8 h-8 rounded-full border border-bg-border bg-bg-card text-text-muted flex items-center justify-center hover:border-accent hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-syne font-bold text-sm text-white min-w-[140px] text-center">
              {formatMonthLabel(year, month)}
            </span>
            <button
              onClick={onNext}
              className="w-8 h-8 rounded-full border border-bg-border bg-bg-card text-text-muted flex items-center justify-center hover:border-accent hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`w-8 h-8 rounded-full border bg-bg-card flex items-center justify-center transition-colors ${
                menuOpen ? 'border-accent text-white' : 'border-bg-border text-text-muted hover:border-accent hover:text-white'
              }`}
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-40 w-52 bg-bg-card border border-bg-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                {menuItems.map((item, i) =>
                  item.divider ? (
                    <div key={i} className="h-px bg-bg-border mx-2" />
                  ) : (
                    <button
                      key={i}
                      onClick={item.onClick}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left text-xs transition-colors ${
                        item.danger
                          ? 'text-red-400 hover:bg-red-500/10'
                          : item.accent
                          ? 'text-violet-300 hover:bg-accent/10'
                          : 'text-text-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="mt-0.5">{item.icon}</span>
                      <span>
                        <span className="block font-medium">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-[10px] text-text-faint">{item.sublabel}</span>
                        )}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />

      {showClearModal && (
        <ClearDataModal
          onClose={() => setShowClearModal(false)}
          onConfirm={() => {
            setShowClearModal(false);
            onClearData();
          }}
        />
      )}
    </>
  );
}