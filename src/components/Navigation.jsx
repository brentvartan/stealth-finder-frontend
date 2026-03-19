import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, LayoutDashboard, Play, Users, PlusCircle, LogOut, Download } from 'lucide-react';
import { items } from '../api/client';

export default function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/scan', icon: Play, label: 'Run Scan' },
    { path: '/watchlist', icon: Users, label: 'Watchlist' },
    { path: '/add-signal', icon: PlusCircle, label: 'Add Signal' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleExport = async () => {
    try {
      // Fetch all items and export as JSON
      const response = await items.getAll({ per_page: 500 });
      const allItems = response.data.items || [];

      const signals = [];
      const watchlist = [];

      allItems.forEach(item => {
        try {
          const meta = JSON.parse(item.description || '{}');
          if (meta._type === 'signal') signals.push({ ...meta, item_id: item.id, title: item.title });
          else if (meta._type === 'watchlist') watchlist.push({ ...meta, item_id: item.id, title: item.title });
        } catch (e) {}
      });

      const data = {
        exported_at: new Date().toISOString(),
        exported_by: user?.email,
        signals_count: signals.length,
        watchlist_count: watchlist.length,
        signals,
        watchlist,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stealth-startups-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg group-hover:shadow-lg transition-shadow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">Stealth Startup Finder</div>
              <div className="text-xs text-slate-500">Bullish Intelligence</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Export data as JSON"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                </div>
                <div className="text-xs text-slate-500 capitalize">{user?.role || 'Analyst'}</div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
