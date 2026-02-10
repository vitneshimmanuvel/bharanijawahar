
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onNav: (screen: string) => void;
  activeScreen: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, onLogout, onNav, activeScreen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Profile Section */}
        <div className="bg-green-700 p-6 text-white">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden">
            <i className="fa-solid fa-scale-balanced text-green-700 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold leading-tight">{user.name}</h2>
          <p className="text-green-100 text-sm font-medium opacity-90 mt-0.5">{user.role.replace('_', ' ')}</p>
          <div className="mt-2 inline-block px-2 py-0.5 bg-green-600/50 rounded-md text-[10px] border border-green-500/30">
            {user.branchId === 'FACTORY' ? 'Admin Access' : `Branch: ${user.branchId}`}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <NavItem 
            icon="fa-chart-pie" 
            label="Dashboard" 
            active={activeScreen === 'dashboard'} 
            onClick={() => onNav('dashboard')} 
          />
          <NavItem 
            icon="fa-plus-circle" 
            label="New Billing" 
            active={activeScreen === 'billing'} 
            onClick={() => onNav('billing')} 
          />
          <NavItem 
            icon="fa-address-book" 
            label="Customers & Address" 
            active={activeScreen === 'customers'} 
            onClick={() => onNav('customers')} 
          />
          <NavItem 
            icon="fa-calendar-check" 
            label="Monthly Statement" 
            active={activeScreen === 'statement'} 
            onClick={() => onNav('statement')} 
          />
          <NavItem 
            icon="fa-building-columns" 
            label="Balance Sheet" 
            active={activeScreen === 'balance_sheet'} 
            onClick={() => onNav('balance_sheet')} 
          />
          <NavItem 
            icon="fa-box" 
            label="Inventory Control" 
            active={activeScreen === 'inventory'} 
            onClick={() => onNav('inventory')} 
          />
          <NavItem 
            icon="fa-file-invoice" 
            label="Reports" 
            active={activeScreen === 'reports'} 
            onClick={() => onNav('reports')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout Session</span>
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-semibold">EESAA v2.1.0-mobile</p>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-200 ${
      active ? 'bg-green-50 text-green-700' : 'text-gray-600 active:bg-gray-100'
    }`}
  >
    <i className={`fa-solid ${icon} text-lg ${active ? 'text-green-600' : 'text-gray-400'}`}></i>
    <span className={`font-semibold text-sm ${active ? 'text-green-700' : 'text-gray-700'}`}>{label}</span>
  </button>
);

export default Sidebar;
