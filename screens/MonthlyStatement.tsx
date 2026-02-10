
import React, { useState, useMemo } from 'react';
import { Customer, Invoice, Payment, Branch, User } from '../types';

interface MonthlyStatementProps {
  user: User;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  branches: Branch[];
  onPrint: (type: 'STATEMENT', data: any) => void;
}

const MonthlyStatement: React.FC<MonthlyStatementProps> = ({ user, customers, invoices, payments, branches, onPrint }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const customer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [selectedCustomerId, customers]);
  const branch = useMemo(() => branches.find(b => b.id === user.branchId) || branches[0], [user.branchId, branches]);

  const statementData = useMemo(() => {
    if (!selectedCustomerId) return [];

    const startOfMonth = new Date(`${selectedMonth}-01T00:00:00`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    const filteredInvoices = invoices.filter(inv => 
      inv.customerId === selectedCustomerId && 
      inv.paymentType === 'CREDIT' &&
      new Date(inv.date) >= startOfMonth && 
      new Date(inv.date) <= endOfMonth
    );

    const filteredPayments = payments.filter(pay => 
      pay.customerId === selectedCustomerId &&
      new Date(pay.date) >= startOfMonth && 
      new Date(pay.date) <= endOfMonth
    );

    const transactions = [
      ...filteredInvoices.map(inv => ({ 
        date: inv.date, 
        desc: `Inv #${inv.invoiceNumber}`, 
        debit: inv.grandTotal, 
        credit: 0 
      })),
      ...filteredPayments.map(pay => ({ 
        date: pay.date, 
        desc: `Receipt #${pay.receiptNumber}`, 
        debit: 0, 
        credit: pay.amount 
      }))
    ];

    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedCustomerId, selectedMonth, invoices, payments]);

  const totals = useMemo(() => {
    return statementData.reduce((acc, t) => ({
      debit: acc.debit + t.debit,
      credit: acc.credit + t.credit
    }), { debit: 0, credit: 0 });
  }, [statementData]);

  const handleShare = () => {
    if (!customer) return;
    const text = `EESAA Monthly Statement\nCustomer: ${customer.name}\nMonth: ${selectedMonth}\nTotal Debit: ₹${totals.debit}\nTotal Credit: ₹${totals.credit}\nClosing Balance: ₹${customer.outstanding}\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    if (!customer) return;
    onPrint('STATEMENT', {
      customer,
      totals,
      transactions: statementData,
      month: selectedMonth
    });
  };

  return (
    <div className="p-4 space-y-6 pb-24 no-print">
      {/* Selector Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Select Customer</label>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Choose Customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Select Month</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
          />
        </div>
      </section>

      {customer ? (
        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
          {/* Paper View */}
          <div className="p-8 space-y-8 bg-white border-b-8 border-gray-50">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-green-700 tracking-tighter">EESAA</h1>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Weighing Scale Enterprise</p>
                <div className="mt-4 text-[11px] text-gray-500 font-medium">
                  <p>{branch.name}</p>
                  <p>{branch.location}</p>
                  <p>GSTIN: {branch.gstin}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-100 px-4 py-2 rounded-xl">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Statement Month</p>
                   <p className="text-sm font-black text-gray-800">{new Date(selectedMonth).toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Customer Info Box */}
            <div className="bg-green-50/50 p-5 rounded-3xl border border-green-100">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Statement For</p>
              <h3 className="text-xl font-black text-gray-800 leading-tight">{customer.name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400">CONTACT</p>
                  <p className="text-xs font-black text-gray-600">+91 {customer.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400">OUTSTANDING</p>
                  <p className="text-xs font-black text-red-600">₹{customer.outstanding.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400">ADDRESS</p>
                  <p className="text-xs font-medium text-gray-600">{customer.address}</p>
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div>
              <div className="flex justify-between border-b-2 border-gray-100 pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span className="w-20">Date</span>
                <span className="flex-1 px-4 text-center">Description</span>
                <span className="w-16 text-right">Debit</span>
                <span className="w-16 text-right">Credit</span>
              </div>
              <div className="divide-y divide-gray-50">
                {statementData.length > 0 ? statementData.map((t, idx) => (
                  <div key={idx} className="flex justify-between py-4 text-xs">
                    <span className="w-20 text-gray-500 font-bold">{new Date(t.date).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                    <span className="flex-1 px-4 text-gray-800 font-bold text-center">{t.desc}</span>
                    <span className="w-16 text-right text-gray-800">{t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '-'}</span>
                    <span className="w-16 text-right text-green-700 font-bold">{t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '-'}</span>
                  </div>
                )) : (
                  <div className="py-12 text-center text-gray-300 font-bold text-sm">No transactions this month</div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="pt-6 border-t-2 border-gray-100">
               <div className="flex justify-between text-sm font-black">
                 <span className="text-gray-400 uppercase tracking-widest text-[10px]">Total Debit / Credit</span>
                 <div className="space-x-8">
                   <span className="text-gray-800">₹{totals.debit.toLocaleString()}</span>
                   <span className="text-green-700">₹{totals.credit.toLocaleString()}</span>
                 </div>
               </div>
               <div className="mt-8 flex justify-between items-center bg-gray-900 text-white p-6 rounded-3xl">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Closing Balance</p>
                    <p className="text-2xl font-black">₹{customer.outstanding.toLocaleString()}</p>
                  </div>
                  <i className="fa-solid fa-stamp text-3xl opacity-20 rotate-12"></i>
               </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-gray-50 flex gap-3">
             <button onClick={handleShare} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all">
               <i className="fa-brands fa-whatsapp text-lg"></i> Send on WhatsApp
             </button>
             <button onClick={handlePrint} className="flex-1 bg-gray-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-100 active:scale-95 transition-all">
               <i className="fa-solid fa-file-pdf text-lg"></i> Direct Print
             </button>
          </div>
        </section>
      ) : (
        <div className="py-24 text-center opacity-30">
          <i className="fa-solid fa-file-invoice text-6xl mb-4"></i>
          <p className="font-black text-lg">Select a customer to<br/>generate statement</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyStatement;
