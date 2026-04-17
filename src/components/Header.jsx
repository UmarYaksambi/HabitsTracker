import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { formatMonthLabel } from '../utils/date';

export default function Header({ year, month, onPrev, onNext, onExport, onImport }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 className="font-syne text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
          Habit Tracker
        </h1>
        <p className="text-xs text-text-muted uppercase tracking-widest mt-1.5">
          Build the life you want — one day at a time
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onExport}
          title="Export data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bg-border bg-bg-card text-text-muted text-xs hover:text-white hover:border-accent transition-colors"
        >
          <Download size={13} />
          Export
        </button>

        <label
          title="Import data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bg-border bg-bg-card text-text-muted text-xs hover:text-white hover:border-accent transition-colors cursor-pointer"
        >
          <Upload size={13} />
          Import
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
        </label>

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
      </div>
    </header>
  );
}
