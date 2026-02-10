
import React from 'react';
import { User, UserRole } from '../types';
import { EESAA_GREEN } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users: User[] = [
    { id: '1', name: 'Rajesh Shah', role: UserRole.FACTORY_ADMIN, branchId: 'FACTORY' },
    { id: '2', name: 'Amit Patel', role: UserRole.BRANCH_ADMIN, branchId: 'B1' },
    { id: '3', name: 'Suresh Kumar', role: UserRole.SALES_STAFF, branchId: 'B1' },
  ];

  return (
    <div className="h-full premium-gradient flex flex-col p-10 max-w-md mx-auto text-white overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <div className="w-28 h-28 bg-white rounded-[32px] flex items-center justify-center shadow-2xl mb-8 animate-float group">
          <i className="fa-solid fa-scale-balanced text-emerald-900 text-5xl transition-transform group-hover:scale-110"></i>
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2">EESAA</h1>
        <p className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.5em] opacity-80">Precision Mobility</p>
      </div>

      <div className="space-y-4 mb-10">
        <h2 className="text-sm font-black text-emerald-200 uppercase tracking-widest text-center mb-6">Internal Access</h2>
        {users.map((u, idx) => (
          <button 
            key={u.id}
            onClick={() => onLogin(u)}
            className="w-full flex items-center gap-5 p-5 bg-white/10 backdrop-blur-xl rounded-[28px] border border-white/10 active:bg-white/20 transition-all group animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-sm">
              <i className="fa-solid fa-fingerprint"></i>
            </div>
            <div className="text-left">
              <h3 className="font-black text-base text-white tracking-tight leading-none mb-1">{u.name}</h3>
              <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest opacity-80">
                {u.role.split('_')[0]} • {u.branchId}
              </p>
            </div>
            <div className="ml-auto text-emerald-500">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center pb-6">
        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest leading-relaxed opacity-60">
          Powered by WeighTech Global<br/>
          Enterprise Digital Core v3.0
        </p>
      </div>
    </div>
  );
};

export default Login;
