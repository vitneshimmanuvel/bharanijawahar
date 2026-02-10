
import React, { useState, useMemo } from 'react';
import { User, UserRole, Invoice, Product, Payment } from '../types';
import { analyzeStockAndSales } from '../services/gemini';

interface DashboardProps {
  user: User;
  invoices: Invoice[];
  products: Product[];
  payments: Payment[];
  onNavigate: (screen: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, invoices, products, payments, onNavigate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const stats = useMemo(() => {
    const isFactory = user.role === UserRole.FACTORY_ADMIN;
    const viewableInvoices = isFactory ? invoices : invoices.filter(i => i.branchId === user.branchId);
    const viewablePayments = isFactory ? payments : payments.filter(p => p.branchId === user.branchId);

    const today = new Date().toISOString().split('T')[0];
    const todaySales = viewableInvoices.filter(inv => inv.date.startsWith(today));
    const totalRev = viewableInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const todayRev = todaySales.reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    const creditSales = viewableInvoices.filter(i => i.paymentType === 'CREDIT').reduce((s, i) => s + i.grandTotal, 0);
    const collections = viewablePayments.reduce((s, p) => s + p.amount, 0);
    const outstanding = creditSales - collections;
    
    const branchSales: Record<string, number> = {};
    viewableInvoices.forEach(inv => {
      branchSales[inv.branchId] = (branchSales[inv.branchId] || 0) + inv.grandTotal;
    });

    const lowStockCount = products.filter(p => {
        const branchId = user.branchId || 'FACTORY';
        return (p.stockCount[branchId] || 0) < p.minStock;
    }).length;

    return { totalRev, todayRev, outstanding, creditSales, lowStockCount };
  }, [invoices, payments, user, products]);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeStockAndSales({ invoices, products, payments, user });
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-1">
            {user.branchId === 'FACTORY' ? 'Headquarters' : `Access: ${user.branchId}`}
          </p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Overview</h2>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl premium-shadow flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-transform">
          <i className="fa-solid fa-bell-concierge"></i>
        </div>
      </header>

      {/* Main Stats - 2x2 Bento Grid */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard label="Sales Today" value={`₹${stats.todayRev.toLocaleString()}`} icon="fa-bolt-lightning" theme="emerald" />
        <StatCard label="Outstanding" value={`₹${stats.outstanding.toLocaleString()}`} icon="fa-hourglass" theme="amber" />
        <StatCard label="Total Rev" value={`₹${stats.totalRev.toLocaleString()}`} icon="fa-crown" theme="slate" colSpan={2} />
      </section>

      {/* Premium AI Section - Mesh Gradient */}
      <section className="mesh-gradient rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden premium-shadow-lg">
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30">
              <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
            </div>
            <h3 className="font-black text-xl tracking-tight leading-none">EESAA Intelligence</h3>
          </div>
          
          {analysis ? (
            <div className="text-sm font-medium leading-relaxed mb-8 bg-emerald-950/40 p-6 rounded-3xl border border-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
              {analysis}
            </div>
          ) : (
             <p className="text-base font-medium opacity-80 mb-8 leading-relaxed">
               Advanced analysis ready. Review branch trends and high-performing products instantly.
             </p>
          )}
          
          <button 
            onClick={handleAIAnalysis} 
            disabled={isAnalyzing} 
            className="w-full bg-white text-emerald-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
          >
            {isAnalyzing ? (
              <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
            ) : (
              <>
                <i className="fa-solid fa-magnifying-glass-chart text-lg"></i>
                RUN ANALYSIS
              </>
            )}
          </button>
        </div>
      </section>

      {/* Action Hub */}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Quick Commands</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionButton label="Register Dealer" icon="fa-user-plus" onClick={() => onNavigate('add-dealer')} color="text-emerald-600" bg="bg-emerald-50" />
          <ActionButton 
            label={stats.lowStockCount > 0 ? `${stats.lowStockCount} Low Stock` : "Stock Health"} 
            icon={stats.lowStockCount > 0 ? "fa-triangle-exclamation" : "fa-boxes-stacked"} 
            onClick={() => onNavigate('inventory')} 
            color={stats.lowStockCount > 0 ? "text-rose-600" : "text-blue-600"} 
            bg={stats.lowStockCount > 0 ? "bg-rose-50" : "bg-blue-50"} 
            badge={stats.lowStockCount > 0}
          />
        </div>
      </section>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; theme: 'emerald' | 'amber' | 'slate'; colSpan?: number }> = ({ label, value, icon, theme, colSpan = 1 }) => {
  const themes = {
    emerald: 'bg-emerald-900 text-white shadow-emerald-900/10',
    amber: 'bg-amber-500 text-white shadow-amber-500/10',
    slate: 'bg-slate-900 text-white shadow-slate-900/10'
  };

  return (
    <div className={`${themes[theme]} p-6 rounded-[3rem] premium-shadow-lg flex flex-col justify-between h-40 ${colSpan === 2 ? 'col-span-2' : ''} transition-all active:scale-[0.98]`}>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <div>
        <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; icon: string; onClick: () => void; color: string; bg: string; badge?: boolean }> = ({ label, icon, onClick, color, bg, badge }) => (
  <button 
    onClick={onClick}
    className={`${bg} ${color} p-6 rounded-[3rem] flex flex-col items-center gap-4 transition-all active:scale-95 border border-white premium-shadow relative`}
  >
    {badge && (
        <span className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
    )}
    <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
    <span className="text-[11px] font-black uppercase tracking-wider text-center">{label}</span>
  </button>
);

export default Dashboard;
