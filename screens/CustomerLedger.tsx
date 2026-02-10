
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Invoice, User, Payment, UserRole } from '../types';

interface CustomerLedgerProps {
  user: User;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  onAddPayment: (p: Payment) => void;
  onAddCustomer: (c: Customer) => void;
  onUpdateCustomer: (c: Customer) => void;
  onPrintReceipt: (p: Payment) => void;
  onPrintLedger: (type: 'STATEMENT', data: any) => void;
  initialAddOpen?: boolean;
}

const CustomerLedger: React.FC<CustomerLedgerProps> = ({ 
  user, customers, invoices, payments, onAddPayment, onAddCustomer, onUpdateCustomer, onPrintReceipt, onPrintLedger, initialAddOpen = false 
}) => {
  const [search, setSearch] = useState('');
  const [viewingLedger, setViewingLedger] = useState<Customer | null>(null);
  const [collectingFor, setCollectingFor] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK'>('CASH');
  
  // Ledger Filtering State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // New Customer Form State
  const [isAddingCustomer, setIsAddingCustomer] = useState(initialAddOpen);

  useEffect(() => {
    if (initialAddOpen) {
        setIsAddingCustomer(true);
    }
  }, [initialAddOpen]);

  const [newCust, setNewCust] = useState({
    name: '',
    mobile: '',
    address: '',
    gst: '',
    creditLimit: '10000'
  });

  // Receipt Emailing State
  const [lastReceipt, setLastReceipt] = useState<Payment | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobile.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleCollect = () => {
    if (!collectingFor || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      receiptNumber: `RCP-${user.branchId || 'F'}-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerId: collectingFor.id,
      amount,
      paymentMethod,
      branchId: user.branchId || 'FACTORY'
    };

    onAddPayment(newPayment);
    setLastReceipt(newPayment);
    setCollectingFor(null);
    setPaymentAmount('');
  };

  const handleSaveCustomer = () => {
    if (!newCust.name || !newCust.mobile || !newCust.address) return;

    const customer: Customer = {
      id: 'C' + (customers.length + 1 + Math.floor(Math.random() * 1000)),
      name: newCust.name,
      mobile: newCust.mobile,
      address: newCust.address,
      gst: newCust.gst || undefined,
      outstanding: 0,
      creditLimit: parseFloat(newCust.creditLimit) || 10000
    };

    onAddCustomer(customer);
    setIsAddingCustomer(false);
    setNewCust({ name: '', mobile: '', address: '', gst: '', creditLimit: '10000' });
  };

  const handleUpdateCustomer = () => {
    if (editingCustomer) {
      onUpdateCustomer(editingCustomer);
      setEditingCustomer(null);
    }
  };

  const getLedgerTransactions = (customerId: string) => {
    const custInvoices = invoices.filter(inv => inv.customerId === customerId && inv.paymentType === 'CREDIT');
    const custPayments = payments.filter(pay => pay.customerId === customerId);
    
    let combined = [
      ...custInvoices.map(inv => ({ type: 'DEBIT' as const, date: inv.date, desc: `Inv #${inv.invoiceNumber}`, amount: inv.grandTotal, debit: inv.grandTotal, credit: 0, id: inv.id, data: inv })),
      ...custPayments.map(pay => ({ type: 'CREDIT' as const, date: pay.date, desc: `Receipt #${pay.receiptNumber}`, amount: pay.amount, debit: 0, credit: pay.amount, id: pay.id, data: pay }))
    ];

    // Apply Date Filters
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      combined = combined.filter(t => new Date(t.date) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      combined = combined.filter(t => new Date(t.date) <= e);
    }

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handlePrintLedger = (cust: Customer) => {
    const txs = getLedgerTransactions(cust.id);
    const totals = txs.reduce((acc, t) => ({
      debit: acc.debit + t.debit,
      credit: acc.credit + t.credit
    }), { debit: 0, credit: 0 });

    onPrintLedger('STATEMENT', {
      customer: cust,
      totals,
      transactions: txs,
      month: new Date().toISOString().slice(0, 7)
    });
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full relative">
      <section>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search name, mobile or address..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-3xl shadow-sm text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </section>

      {emailSuccess && (
        <div className="fixed top-20 left-4 right-4 z-[100] bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="fa-solid fa-circle-check text-xl"></i>
          <p className="font-bold text-sm">Receipt sent successfully!</p>
        </div>
      )}

      <section className="space-y-4">
        {filteredCustomers.map(customer => {
          const isExceeded = customer.outstanding > customer.creditLimit;
          const isNearLimit = !isExceeded && customer.outstanding >= (customer.creditLimit * 0.9);
          
          let cardStyle = "border-gray-100 shadow-sm";
          let bgStyle = "";
          let textStyle = "text-orange-600";
          let badge = null;
          let balanceIcon = null;

          if (isExceeded) {
            cardStyle = "border-red-200 shadow-red-50 shadow-lg";
            bgStyle = "bg-red-50/30";
            textStyle = "text-red-600";
            balanceIcon = <i className="fa-solid fa-triangle-exclamation text-xs animate-pulse"></i>;
            badge = (
              <span className="flex items-center gap-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                <i className="fa-solid fa-triangle-exclamation"></i> CREDIT EXCEEDED
              </span>
            );
          } else if (isNearLimit) {
            cardStyle = "border-amber-200 shadow-amber-50 shadow-lg";
            bgStyle = "bg-amber-50/30";
            textStyle = "text-amber-600";
            balanceIcon = <i className="fa-solid fa-circle-exclamation text-xs"></i>;
            badge = (
              <span className="flex items-center gap-1 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                <i className="fa-solid fa-circle-exclamation"></i> NEAR LIMIT
              </span>
            );
          }

          return (
            <div key={customer.id} className={`bg-white rounded-3xl overflow-hidden border transition-all active:scale-[0.98] ${cardStyle}`}>
              <div className={`p-5 flex justify-between items-start ${bgStyle}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{customer.name}</h3>
                    {badge}
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mt-1"><i className="fa-solid fa-phone mr-1.5 text-green-600"></i> {customer.mobile}</p>
                </div>
                <div className="text-right ml-4 flex flex-col items-end">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</p>
                  <div className={`flex items-center gap-1.5 text-xl font-black ${textStyle}`}>
                    {balanceIcon}
                    <span>₹{customer.outstanding.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handlePrintLedger(customer)} className="text-blue-600 text-[10px] font-black uppercase"><i className="fa-solid fa-file-pdf"></i> PDF</button>
                    {(user.role === UserRole.FACTORY_ADMIN || user.role === UserRole.BRANCH_ADMIN) && (
                        <button onClick={() => setEditingCustomer(customer)} className="text-gray-400 text-[10px] font-black uppercase">Edit</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => setCollectingFor(customer)}
                  className="flex-1 py-3 bg-green-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-receipt mr-2"></i> Payment
                </button>
                <button 
                  onClick={() => setViewingLedger(customer)}
                  className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-book-open mr-2"></i> Ledger
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Edit Customer</h3>
              <div className="space-y-4">
                <EditField label="Name" value={editingCustomer.name} onChange={(v) => setEditingCustomer({...editingCustomer, name: v})} />
                <EditField label="Mobile" value={editingCustomer.mobile} onChange={(v) => setEditingCustomer({...editingCustomer, mobile: v})} />
                <EditField label="Address" value={editingCustomer.address} onChange={(v) => setEditingCustomer({...editingCustomer, address: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="GSTIN" value={editingCustomer.gst || ''} onChange={(v) => setEditingCustomer({...editingCustomer, gst: v})} />
                  <EditField label="Credit Limit" value={editingCustomer.creditLimit.toString()} onChange={(v) => setEditingCustomer({...editingCustomer, creditLimit: parseFloat(v)})} type="number" />
                </div>
              </div>
              <div className="flex gap-2 pt-6">
                <button onClick={() => setEditingCustomer(null)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
                <button onClick={handleUpdateCustomer} className="flex-[2] py-4 bg-green-700 text-white rounded-2xl font-black shadow-xl">Save</button>
              </div>
           </div>
        </div>
      )}

      {(user.role === UserRole.FACTORY_ADMIN || user.role === UserRole.BRANCH_ADMIN) && (
        <button 
          onClick={() => setIsAddingCustomer(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-30 border-4 border-white"
        >
          <i className="fa-solid fa-user-plus text-xl"></i>
        </button>
      )}

      {isAddingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-md bg-white rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-gray-800 mb-2">New Dealer</h3>
            <div className="space-y-4">
              <InputField label="Name" value={newCust.name} onChange={(v) => setNewCust({...newCust, name: v})} placeholder="Firm Name" />
              <InputField label="Mobile" value={newCust.mobile} onChange={(v) => setNewCust({...newCust, mobile: v})} placeholder="Mobile Number" type="tel" />
              <InputField label="Address" value={newCust.address} onChange={(v) => setNewCust({...newCust, address: v})} placeholder="Address" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="GSTIN" value={newCust.gst} onChange={(v) => setNewCust({...newCust, gst: v})} placeholder="Optional" />
                <InputField label="Limit (₹)" value={newCust.creditLimit} onChange={(v) => setNewCust({...newCust, creditLimit: v})} placeholder="10000" type="number" />
              </div>
              <div className="flex gap-2 pt-6">
                <button onClick={() => setIsAddingCustomer(false)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
                <button onClick={handleSaveCustomer} className="flex-[2] py-4 bg-green-700 text-white rounded-2xl font-black shadow-xl">Save Dealer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingLedger && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
          <header className="bg-white px-4 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewingLedger(null)} className="p-2 text-gray-400"><i className="fa-solid fa-arrow-left"></i></button>
              <div>
                <h4 className="font-black text-gray-800">{viewingLedger.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transaction History</p>
              </div>
            </div>
            <button onClick={() => handlePrintLedger(viewingLedger)} className="p-2 text-blue-600"><i className="fa-solid fa-file-pdf text-xl"></i></button>
          </header>

          {/* Ledger Filter Bar */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex gap-3 items-center overflow-x-auto no-scrollbar">
            <div className="flex flex-col">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">From</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border-none rounded-xl text-[10px] font-bold p-2 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">To</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border-none rounded-xl text-[10px] font-bold p-2 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <button 
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              className="mt-4 px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-[8px] font-black uppercase hover:bg-gray-200"
            >
              Reset
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {getLedgerTransactions(viewingLedger.id).map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'DEBIT' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <i className={`fa-solid ${t.type === 'DEBIT' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">{t.desc}</h5>
                    <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-black text-sm ${t.type === 'DEBIT' ? 'text-gray-800' : 'text-green-700'}`}>
                    {t.type === 'DEBIT' ? '-' : '+'}₹{t.amount.toLocaleString()}
                  </p>
                  {t.type === 'CREDIT' && (
                    <button onClick={() => onPrintReceipt(t.data as Payment)} className="text-gray-400 p-2"><i className="fa-solid fa-print"></i></button>
                  )}
                </div>
              </div>
            ))}
            {getLedgerTransactions(viewingLedger.id).length === 0 && (
              <div className="py-20 text-center opacity-20">
                <i className="fa-solid fa-calendar-xmark text-6xl mb-4"></i>
                <p className="font-black">No transactions found for this period</p>
              </div>
            )}
          </div>
        </div>
      )}

      {collectingFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Collect Payment</h3>
            <div className="space-y-4">
              <InputField label="Amount (₹)" value={paymentAmount} onChange={(v) => setPaymentAmount(v)} placeholder="0.00" type="number" />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'UPI', 'BANK'].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m as any)} className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${paymentMethod === m ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-400 border-gray-100'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setCollectingFor(null)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
                <button onClick={handleCollect} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border-none p-3.5 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 shadow-sm" />
  </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 text-sm" />
  </div>
);

export default CustomerLedger;
