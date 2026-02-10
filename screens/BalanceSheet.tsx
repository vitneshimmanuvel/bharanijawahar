
import React, { useMemo } from 'react';
import { Invoice, Payment, Branch, User, Product } from '../types';

interface BalanceSheetProps {
  user: User;
  invoices: Invoice[];
  payments: Payment[];
  branches: Branch[];
  products: Product[];
  onPrint: (type: 'BALANCE_SHEET', data: any) => void;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ user, invoices, payments, branches, products, onPrint }) => {
  const financialData = useMemo(() => {
    // CURRENT ASSETS
    const cashSales = invoices.filter(i => i.paymentType !== 'CREDIT').reduce((s, i) => s + i.grandTotal, 0);
    const collections = payments.reduce((s, p) => s + p.amount, 0);
    const cashOnHand = cashSales + collections;

    const creditSales = invoices.filter(i => i.paymentType === 'CREDIT').reduce((s, i) => s + i.grandTotal, 0);
    const accountsReceivable = creditSales - collections;

    const inventoryValue = products.reduce((total, prod) => {
      const stock = (Object.values(prod.stockCount) as number[]).reduce((a, b) => a + b, 0);
      return total + (stock * prod.rate);
    }, 0);

    const totalCurrentAssets = cashOnHand + accountsReceivable + inventoryValue;

    // FIXED ASSETS
    const fixedAssets = {
      machinery: 500000,
      vehicles: 250000,
      equipment: 100000,
    };
    const grossFixedAssets = fixedAssets.machinery + fixedAssets.vehicles + fixedAssets.equipment;
    const accumulatedDepreciation = 150000;
    const netFixedAssets = grossFixedAssets - accumulatedDepreciation;

    const totalAssets = totalCurrentAssets + netFixedAssets;

    // LIABILITIES
    const taxPayable = invoices.reduce((s, i) => s + i.totalTax, 0);
    const supplierPayables = totalAssets * 0.15; 
    const otherLiabilities = 50000; 
    
    const totalLiabilities = taxPayable + supplierPayables + otherLiabilities;

    // EQUITY
    const totalEquity = totalAssets - totalLiabilities;

    // Branch Performance
    const branchBreakdown = branches.map(b => {
      const bInvoices = invoices.filter(i => i.branchId === b.id);
      const bPayments = payments.filter(p => p.branchId === b.id);
      
      const sales = bInvoices.reduce((s, i) => s + i.grandTotal, 0);
      const rec = bPayments.reduce((s, p) => s + p.amount, 0);
      const bCredit = bInvoices.filter(i => i.paymentType === 'CREDIT').reduce((s, i) => s + i.grandTotal, 0);
      
      const bInventory = products.reduce((total, prod) => {
        return total + ((prod.stockCount[b.id] || 0) * prod.rate);
      }, 0);

      return {
        name: b.name,
        sales,
        outstanding: bCredit - rec,
        inventory: bInventory
      };
    });

    return {
      assets: { 
        cashOnHand, 
        accountsReceivable, 
        inventoryValue, 
        totalCurrentAssets,
        fixedAssets,
        grossFixedAssets,
        accumulatedDepreciation,
        netFixedAssets,
        totalAssets 
      },
      liabilities: { taxPayable, supplierPayables, otherLiabilities, totalLiabilities },
      equity: { totalEquity },
      branchBreakdown
    };
  }, [invoices, payments, branches, products]);

  const handlePrint = () => {
    onPrint('BALANCE_SHEET', financialData);
  };

  return (
    <div className="p-4 space-y-8 pb-24 animate-in fade-in duration-500 no-print bg-gray-50/50">
      <header className="flex flex-col items-center text-center pt-8 pb-6">
        <div className="w-16 h-16 bg-green-700 rounded-3xl flex items-center justify-center shadow-2xl mb-4 border-4 border-white rotate-3">
          <i className="fa-solid fa-file-invoice-dollar text-white text-2xl"></i>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Balance Sheet</h2>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">Enterprise Financial Summary</p>
      </header>

      {/* ASSETS SECTION */}
      <div className="space-y-4">
        <SectionHeader title="Assets" icon="fa-vault" color="text-green-700" />
        
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <div className="p-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Assets</h4>
            <div className="space-y-3">
              <BalanceRow label="Cash & Bank Balances" value={financialData.assets.cashOnHand} color="text-green-700" />
              <BalanceRow label="Accounts Receivable" value={financialData.assets.accountsReceivable} color="text-orange-600" />
              <BalanceRow label="Total Stock Inventory" value={financialData.assets.inventoryValue} />
            </div>
          </div>
          
          <div className="p-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Fixed Assets</h4>
            <div className="space-y-3">
              <BalanceRow label="Gross Plant & Assets" value={financialData.assets.grossFixedAssets} />
              <BalanceRow label="Accumulated Depr." value={-financialData.assets.accumulatedDepreciation} color="text-red-400" />
            </div>
          </div>

          <div className="p-6 bg-green-50/30 flex justify-between items-center">
            <span className="text-[11px] font-black text-green-800 uppercase tracking-widest">Total Enterprise Assets</span>
            <span className="text-2xl font-black text-green-900">₹{financialData.assets.totalAssets.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* LIABILITIES SECTION */}
      <div className="space-y-4">
        <SectionHeader title="Liabilities" icon="fa-hand-holding-dollar" color="text-red-600" />
        
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <div className="p-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Liabilities</h4>
            <div className="space-y-3">
              <BalanceRow label="Statutory Taxes (GST)" value={financialData.liabilities.taxPayable} color="text-red-600" />
              <BalanceRow label="Sundry Creditors" value={financialData.liabilities.supplierPayables} />
              <BalanceRow label="Operational Liabilities" value={financialData.liabilities.otherLiabilities} />
            </div>
          </div>

          <div className="p-6 bg-red-50/30 flex justify-between items-center">
            <span className="text-[11px] font-black text-red-800 uppercase tracking-widest">Total Liabilities</span>
            <span className="text-2xl font-black text-red-900">₹{financialData.liabilities.totalLiabilities.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* EQUITY / NET WORTH SECTION */}
      <div className="space-y-4">
        <SectionHeader title="Equity" icon="fa-crown" color="text-indigo-600" />
        
        <div className="bg-indigo-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 text-center">
            <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-2">Owners Equity & Reserves</p>
            <h3 className="text-4xl font-black tracking-tighter mb-4">₹{financialData.equity.totalEquity.toLocaleString()}</h3>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-950/50 rounded-full border border-indigo-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Financial Position Strong</p>
            </div>
          </div>
        </div>
      </div>

      {/* NETWORK METRICS */}
      <div className="space-y-4">
        <SectionHeader title="Branch Performance Metrics" icon="fa-sitemap" color="text-gray-500" />
        
        <div className="space-y-3">
          {financialData.branchBreakdown.map((bp, idx) => (
            <div key={bp.name} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-gray-800 text-sm tracking-tight">{bp.name}</span>
                <i className="fa-solid fa-location-dot text-[10px] text-gray-300"></i>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Sales" value={bp.sales} color="text-indigo-600" />
                <Metric label="Outstanding" value={bp.outstanding} color="text-orange-600" />
                <Metric label="Inventory" value={bp.inventory} color="text-green-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          onClick={handlePrint}
          className="flex-1 bg-green-700 text-white py-5 rounded-3xl font-black text-sm shadow-2xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-print"></i> Download Financial Report
        </button>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon: string; color: string }> = ({ title, icon, color }) => (
  <div className="flex items-center gap-3 ml-2">
    <div className={`w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center ${color}`}>
      <i className={`fa-solid ${icon} text-sm`}></i>
    </div>
    <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">{title}</h3>
  </div>
);

const BalanceRow: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = 'text-gray-900' }) => (
  <div className="flex justify-between items-center">
    <span className="text-[13px] text-gray-400 font-bold">{label}</span>
    <span className={`text-[15px] font-black ${color}`}>₹{value.toLocaleString()}</span>
  </div>
);

const Metric: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-gray-50/50 p-2 rounded-2xl border border-gray-100/50">
    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center mb-1 leading-none">{label}</p>
    <p className={`text-[10px] font-black ${color} text-center`}>₹{(value / 1000).toFixed(1)}k</p>
  </div>
);

export default BalanceSheet;
