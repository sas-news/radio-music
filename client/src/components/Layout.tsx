import { Outlet, NavLink, useLocation } from 'react-router-dom';
import PlayerBar from './PlayerBar';

const NAV_ITEMS = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/ai-select', label: 'AI選曲', icon: '🤖' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 overflow-y-auto pb-24 px-3 pt-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      <PlayerBar />

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-safe">
        <div className="max-w-2xl mx-auto flex justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
