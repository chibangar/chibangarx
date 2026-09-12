import { ListFilter, ArrowUpDown, Clock, HardDrive, Timer, Gamepad2 } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'size' | 'duration' | 'game';

export interface ContentFiltersProps {
  uniqueGames: string[];
  onGameFilterChange: (selectedGames: string[]) => void;
  onSortChange: (sortOption: SortOption) => void;
  sectionId: string;
  selectedGames: string[];
  sortOption: SortOption;
}

export default function ContentFilters({
  uniqueGames, onGameFilterChange, onSortChange, sectionId, selectedGames, sortOption,
}: ContentFiltersProps) {
  const toggleGameSelection = (game: string) => {
    const newSelectedGames = selectedGames.includes(game) ? selectedGames.filter((g) => g !== game) : [...selectedGames, game];
    onGameFilterChange(newSelectedGames);
  };

  const clearFilters = () => onGameFilterChange([]);

  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
    try { (document.activeElement as HTMLElement)?.blur(); } catch {}
  };

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'newest': return 'Newest';
      case 'oldest': return 'Oldest';
      case 'size': return 'Size';
      case 'duration': return 'Duration';
      case 'game': return 'Game A-Z';
    }
  };

  const sortOptions: { option: SortOption; icon: React.ReactNode; label: string }[] = [
    { option: 'newest', icon: <Clock size={16} />, label: 'Newest' },
    { option: 'oldest', icon: <Clock size={16} />, label: 'Oldest' },
    { option: 'size', icon: <HardDrive size={16} />, label: 'Size' },
    { option: 'duration', icon: <Timer size={16} />, label: 'Duration' },
    { option: 'game', icon: <Gamepad2 size={16} />, label: 'Game A-Z' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          disabled={uniqueGames.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            uniqueGames.length === 0 ? 'opacity-50 cursor-not-allowed border-chibangarx-border text-chibangarx-text-secondary'
            : selectedGames.length > 0 ? 'border-chibangarx-primary bg-chibangarx-primary/10 text-chibangarx-primary'
            : 'border-chibangarx-border text-chibangarx-text-secondary hover:border-chibangarx-primary/50'
          }`}
          onClick={() => { const d = document.getElementById(`${sectionId}-filter-dropdown`); if (d) d.classList.toggle('hidden'); }}
        >
          <ListFilter size={14} />
          Filter
          {selectedGames.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-chibangarx-primary text-white">{selectedGames.length}</span>
          )}
        </button>
        <div id={`${sectionId}-filter-dropdown`} className="hidden absolute right-0 top-full mt-1 z-50 w-56 bg-chibangarx-card border border-chibangarx-border rounded-xl shadow-lg p-2">
          <button className={`text-xs mb-2 px-2 ${selectedGames.length > 0 ? 'text-chibangarx-primary cursor-pointer hover:underline' : 'text-chibangarx-text-secondary cursor-not-allowed'}`} onClick={clearFilters}>Clear all</button>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {uniqueGames.length > 0 ? uniqueGames.map((game) => (
              <label key={game} className="flex items-center gap-2 px-2 py-1.5 text-sm text-chibangarx-text rounded-lg hover:bg-chibangarx-bg cursor-pointer transition-colors">
                <input type="checkbox" className="accent-chibangarx-primary" checked={selectedGames.includes(game)} onChange={() => toggleGameSelection(game)} />
                <span className="truncate">{game}</span>
              </label>
            )) : (
              <p className="text-xs text-chibangarx-text-secondary px-2 py-1">No games available</p>
            )}
          </div>
        </div>
      </div>
      <div className="relative">
        <button
          disabled={uniqueGames.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            uniqueGames.length === 0 ? 'opacity-50 cursor-not-allowed border-chibangarx-border text-chibangarx-text-secondary'
            : 'border-chibangarx-border text-chibangarx-text-secondary hover:border-chibangarx-primary/50'
          }`}
          onClick={() => { const d = document.getElementById(`${sectionId}-sort-dropdown`); if (d) d.classList.toggle('hidden'); }}
        >
          <ArrowUpDown size={14} />
          {getSortLabel(sortOption)}
        </button>
        <div id={`${sectionId}-sort-dropdown`} className="hidden absolute right-0 top-full mt-1 z-50 w-48 bg-chibangarx-card border border-chibangarx-border rounded-xl shadow-lg p-1">
          {sortOptions.map(({ option, icon, label }) => (
            <button key={option} className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
              sortOption === option ? 'text-chibangarx-primary bg-chibangarx-primary/10' : 'text-chibangarx-text hover:bg-chibangarx-bg'
            }`} onClick={() => handleSortChange(option)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
