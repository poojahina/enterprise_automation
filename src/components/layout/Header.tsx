import React from 'react';
import { useStore } from '../../state/store';
import { Bell, Search, User, Shield, Wrench, Code, Package } from 'lucide-react';
import type { Role } from '../../models/types';

const roleIcons: Record<Role, React.ReactNode> = {
  'Business User': <User className="w-3.5 h-3.5" />,
  'Automation COE Analyst': <Wrench className="w-3.5 h-3.5" />,
  'Solution Architect': <Code className="w-3.5 h-3.5" />,
  'Product Owner': <Package className="w-3.5 h-3.5" />,
};

const roleColors: Record<Role, string> = {
  'Business User': 'from-blue-500 to-cyan-500',
  'Automation COE Analyst': 'from-purple-500 to-pink-500',
  'Solution Architect': 'from-emerald-500 to-teal-500',
  'Product Owner': 'from-amber-500 to-orange-500',
};

const roles: Role[] = ['Business User', 'Automation COE Analyst', 'Solution Architect', 'Product Owner'];

const Header: React.FC = () => {
  const { role, setRole } = useStore();

  return (
    <header className="flex items-center justify-between h-14 px-5 bg-[hsl(220,25%,10%)] border-b border-white/10" id="app-header">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search opportunities..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          id="search-input"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors" id="notifications-button">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br ${roleColors[role]} text-white`}>
            {roleIcons[role]}
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-medium text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none pr-6"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 4px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
            id="role-switcher"
          >
            {roles.map(r => (
              <option key={r} value={r} className="bg-gray-900 text-gray-200">{r}</option>
            ))}
          </select>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="text-xs font-medium text-gray-300">Ashutosh</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
