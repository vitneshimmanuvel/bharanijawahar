
import React, { useState, useMemo } from 'react';
import { User, Invoice, Branch } from '../types';

interface ReportsProps {
  user: User;
  invoices: Invoice[];
  branches: Branch[];
  products: any[];
  onPrint: (type: 'REPORT_LIST', data: Invoice[]) => void;
}

const Reports: React.FC<ReportsProps> = ({ user, invoices, branches, products, onPrint }) => {
  const [filter, setFilter] = useState('month');

  const filteredInvoices = useMemo(() => {
    // Basic filter logic (mocked for demo as everything)
    return invoices;
  }, [invoices, filter]);

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  const handleShare = (inv: Invoice) => {
    const text = `EESAA INVOICE\nNo: ${inv.invoiceNumber}\nDate: ${new Date(inv.date).toLocaleDateString()}\nCustomer: ${inv.customerName}\nAmount: ₹${inv.grandTotal.toLocaleString()}\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Filters Header */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['today', 'yesterday', 'month', 'custom'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              filter === t ? 'bg-green-700 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Period Revenue</p>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">₹{totalRevenue.toLocaleString()}</h2>
        </div>
        <button 
          onClick={() => onPrint('REPORT_LIST', filteredInvoices)}
          className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-file-arrow-down text-xl"></i>
        </button>
      </div>

      <div className="flex justify-between items-center px-1">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Transactions</h3>
         <button 
            onClick={() => onPrint('REPORT_LIST', filteredInvoices)}
            className="text-[10px] font-black text-blue-600 uppercase"
         >
            Download PDF
         </button>
      </div>

      <section className="space-y-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => (
            <div key={inv.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.isSynced ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                   <i className={`fa-solid ${inv.isSynced ? 'fa-check-double' : 'fa-cloud-arrow-up'}`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{inv.customerName}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-black text-gray-800">₹{inv.grandTotal.toLocaleString()}</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => handleShare(inv)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-xs">
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                  {/* Note: This is simplified to just one type of print, but logically it would trigger the invoice print */}
                  <button onClick={() => onPrint('REPORT_LIST', [inv])} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs">
                    <i className="fa-solid fa-print"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
            <p className="text-sm font-bold">No records found</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Reports;
