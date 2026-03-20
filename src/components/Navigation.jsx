import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Play, Users, PlusCircle, LogOut, Download } from 'lucide-react';
import { items } from '../api/client';

// Bullish logo mark — square border + two parallelogram bars
const BullishIcon = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="33" height="33" stroke="currentColor" strokeWidth="3" />
    <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="currentColor" />
    <polygon points="8.5,22 27,22 26,25 8.5,25" fill="currentColor" />
  </svg>
);

export default function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
    { path: '/scan',       icon: Play,            label: 'Run Scan'   },
    { path: '/watchlist',  icon: Users,           label: 'Watchlist'  },
    { path: '/add-signal', icon: PlusCircle,      label: 'Add Signal' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleExport = async () => {
    try {
      const response = await items.getAll({ per_page: 500 });
      const allItems = response.data.items || [];

      const signals   = [];
      const watchlist = [];

      allItems.forEach(item => {
        try {
          const meta = JSON.parse(item.description || '{}');
          if (meta._type === 'signal')    signals.push({ ...meta, item_id: item.id, title: item.title });
          else if (meta._type === 'watchlist') watchlist.push({ ...meta, item_id: item.id, title: item.title });
        } catch (e) {}
      });

      const data = {
        exported_at:     new Date().toISOString(),
        exported_by:     user?.email,
        signals_count:   signals.length,
        watchlist_count: watchlist.length,
        signals,
        watchlist,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `stealth-startups-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <nav style={{ backgroundColor: '#000000' }} className="border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <BullishIcon className="w-7 h-7 text-white group-hover:text-[#052EF0] transition-colors" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-white text-base tracking-wide uppercase">
                Stealth Finder
              </span>
              <span className="font-editorial italic text-[11px] text-neutral-400 tracking-wide">
                Bullish Intelligence
              </span>
            </div>
          </Link>

          {/* ── Nav Links ── */}
          <div className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon   = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors
                    ${active
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white'
                    }
                  `}
                >
                  {/* Active indicator bar at bottom */}
                  {active && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ backgroundColor: '#052EF0' }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right side: export + user ── */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors rounded"
              title="Export data as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <div className="h-5 w-px bg-neutral-700 mx-1" />

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-medium text-white leading-none">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                </div>
                <div className="text-[10px] text-neutral-500 capitalize mt-0.5">{user?.role || 'Analyst'}</div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-neutral-400 hover:text-white transition-colors rounded"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
