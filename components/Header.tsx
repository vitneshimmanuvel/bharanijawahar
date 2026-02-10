
import React from 'react';
import { User, UserRole } from '../types';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
  isOnline: boolean;
  activeScreen: string;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick, isOnline, activeScreen }) => {
  const getTitle = () => {
    switch(activeScreen) {
      case 'dashboard': return 'Home';
      case 'billing': return 'Point of Sale';
      case 'inventory': return 'Inventory';
      case 'reports': return 'Analytics';
      case 'customers': return 'Dealers';
      default: return 'EESAA';
    }
  };

  return (
    <header className="glass-effect px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30 border-b border-gray-200/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="w-10 h-10 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
        >
          <i className="fa-solid fa-bars-staggered text-lg"></i>
        </button>
        <div>
          <h1 className="font-black text-xl text-slate-900 tracking-tight leading-none">{getTitle()}</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
          isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          {isOnline ? 'LIVE' : 'OFFLINE'}
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 border border-emerald-700/50">
           <i className="fa-solid fa-user-tie text-sm"></i>
        </div>
      </div>
    </header>
  );
};

export default Header;
