import React from 'react';
import { Zap, BarChart3, BookOpen, Globe } from 'lucide-react';

export type NavTab = 'assist' | 'review' | 'openings' | 'chesscom';

interface StitchNavBarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unresolvedBlundersCount?: number;
}

export const StitchNavBar: React.FC<StitchNavBarProps> = ({
  activeTab,
  onChangeTab,
  unresolvedBlundersCount = 0
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'assist',
      label: 'Asisten Live',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'review',
      label: 'Review Game',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: unresolvedBlundersCount > 0 ? unresolvedBlundersCount : undefined
    },
    {
      id: 'openings',
      label: 'Database ECO',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'chesscom',
      label: 'Chess.com',
      icon: <Globe className="w-5 h-5" />
    }
  ];

  return (
    <nav 
      aria-label="Navigasi Utama" 
      className="shrink-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 z-40"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center min-h-[48px] py-1 px-1 group cursor-pointer focus:outline-none"
              aria-selected={isActive}
            >
              {/* Material 3 / Stitch Active Indicator Pill */}
              <div
                className={`relative flex items-center justify-center px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
                }`}
              >
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
