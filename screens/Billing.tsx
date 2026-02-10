
import React, { useState, useMemo } from 'react';
import { User, Product, Customer, PaymentType, Invoice, InvoiceItem, UserRole } from '../types';
import { generateEmailDraft } from '../services/gemini';

interface BillingProps {
  user: User;
  products: Product[];
  customers: Customer[];
  onSave: (invoice: Invoice) => void;
  onPrint: (type: 'INVOICE', data: Invoice) => void;
}

const Billing: React.FC<BillingProps> = ({ user, products, customers, onSave, onPrint }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  
  // Printing states
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<'IDLE' | 'CONNECTING' | 'SENDING'>('IDLE');

  // Email states
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'IDLE' | 'DRAFTING' | 'SENDING' | 'SENT'>('IDLE');

  // Overlimit Override
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = subtotal + totalTax;

  const handleAddItem = (product: Product) => {
    const branchId = user.branchId || 'FACTORY';
    const currentStock = product.stockCount[branchId] || 0;
    const inCart = cart.find(i => i.productId === product.id)?.quantity || 0;

    if (currentStock <= inCart) {
      setError(`Insufficient stock for ${product.name}. Available: ${currentStock}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { 
        ...i, 
        quantity: i.quantity + 1,
        tax: ((i.quantity + 1) * i.rate * product.taxPercent) / 100,
        total: (i.quantity + 1) * i.rate * (1 + product.taxPercent / 100)
      } : i));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        rate: product.rate,
        tax: (product.rate * product.taxPercent) / 100,
        total: product.rate * (1 + product.taxPercent / 100)
      }]);
    }
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    const branchId = user.branchId || 'FACTORY';
    const currentStock = product.stockCount[branchId] || 0;
    if (delta > 0 && currentStock <= item.quantity) {
        setError("Cannot exceed available stock");
        setTimeout(() => setError(null), 2000);
        return;
    }

    setCart(cart.map(i => i.productId === productId ? {
      ...i,
      quantity: newQty,
      tax: (newQty * i.rate * product.taxPercent) / 100,
      total: newQty * i.rate * (1 + product.taxPercent / 100)
    } : i));
  };

  const executePrintAndSave = async () => {
    if (!selectedCustomer) return;

    setIsPrinting(true);
    setPrintStatus('CONNECTING');

    const invoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `EESAA-${user.branchId || 'F'}-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      branchId: user.branchId || 'FACTORY',
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart,
      subtotal,
      totalTax,
      grandTotal,
      paymentType,
      outstandingAtTime: selectedCustomer.outstanding,
      isSynced: navigator.onLine
    };

    await new Promise(resolve => setTimeout(resolve, 1500));
    setPrintStatus('SENDING');
    
    onSave(invoice);
    setLastInvoice(invoice);
    onPrint('INVOICE', invoice);
    
    setIsPrinting(false);
    setPrintStatus('IDLE');
    setIsSuccess(true);
    setShowOverrideConfirm(false);
    setIsCheckoutMode(false);
  };

  const handleSaveAndPrint = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to the cart.");
      return;
    }

    if (!selectedCustomer) {
      setError("Please select a customer first.");
      return;
    }

    const alreadyOver = selectedCustomer.outstanding > selectedCustomer.creditLimit;
    const willBeOver = (selectedCustomer.outstanding + grandTotal) > selectedCustomer.creditLimit;
    const isRestrictedRole = user.role === UserRole.BRANCH_ADMIN || user.role === UserRole.SALES_STAFF;

    if (paymentType === PaymentType.CREDIT && (alreadyOver || willBeOver) && isRestrictedRole) {
      setShowOverrideConfirm(true);
      return;
    }

    executePrintAndSave();
  };

  const handleEmailInvoice = async () => {
    if (!lastInvoice || !selectedCustomer) return;
    setIsEmailing(true);
    setEmailStatus('DRAFTING');
    try {
      const draft = await generateEmailDraft(lastInvoice, selectedCustomer);
      setEmailStatus('SENDING');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEmailStatus('SENT');
      setTimeout(() => { setIsEmailing(false); setEmailStatus('IDLE'); }, 2000);
    } catch (e) {
      setError("Email service unavailable.");
      setIsEmailing(false);
    }
  };

  const resetBilling = () => {
    setIsSuccess(false);
    setCart([]);
    setSelectedCustomer(null);
    setLastInvoice(null);
    setEmailStatus('IDLE');
    setPrintStatus('IDLE');
    setShowOverrideConfirm(false);
    setIsCheckoutMode(false);
  };

  if (isSuccess && lastInvoice) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 no-print">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-6 border-4 border-green-200 shadow-lg relative">
          <i className="fa-solid fa-check text-4xl"></i>
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Sale Recorded!</h2>
        <p className="text-gray-500 font-medium">Customer: <span className="font-bold text-gray-800">{selectedCustomer?.name}</span></p>
        <p className="text-xl font-black text-green-700 mt-4 mb-8">₹{grandTotal.toLocaleString()}</p>
        <div className="w-full space-y-3">
          <button onClick={handleEmailInvoice} disabled={emailStatus === 'SENT' || isEmailing} className="w-full py-4 bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3">
            {emailStatus === 'SENT' ? 'Email Sent' : isEmailing ? 'Sending...' : 'Email Receipt'}
          </button>
          <button onClick={() => onPrint('INVOICE', lastInvoice)} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-black text-sm">Re-print Receipt</button>
          <button onClick={resetBilling} className="w-full py-4 bg-white border border-gray-100 text-green-700 rounded-2xl font-black text-sm">New Transaction</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 no-print">
      {/* Search and Category Bar */}
      <div className="bg-white p-4 sticky top-0 z-20 space-y-3 border-b border-gray-100 shadow-sm">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border-none p-3 pl-12 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                selectedCategory === cat ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-32">
        {filteredProducts.map(p => {
          const stock = p.stockCount[user.branchId || 'FACTORY'] || 0;
          const cartItem = cart.find(i => i.productId === p.id);
          const isLow = stock < p.minStock;
          
          return (
            <div key={p.id} className={`bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm flex flex-col justify-between transition-all active:scale-95 ${stock <= 0 ? 'opacity-60 grayscale' : ''}`}>
               {/* Product Image Section */}
               <div className="h-24 bg-gray-100 relative">
                 <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                 <div className="absolute top-2 left-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md text-white ${stock <= 0 ? 'bg-red-500/80' : isLow ? 'bg-orange-500/80' : 'bg-green-600/80'}`}>
                        {stock <= 0 ? 'Out' : isLow ? 'Low' : 'In Stock'}
                    </span>
                 </div>
               </div>

               <div className="p-4 flex flex-col flex-1">
                 <div className="mb-3">
                   <h4 className="text-[11px] font-black text-gray-800 leading-tight mb-0.5">{p.name}</h4>
                   <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{p.sku}</p>
                 </div>
                 
                 <div className="mt-auto">
                   <p className="text-sm font-black text-gray-900 mb-3">₹{p.rate.toLocaleString()}</p>
                   {cartItem ? (
                     <div className="flex items-center justify-between bg-green-50 rounded-2xl p-1">
                        <button onClick={() => updateQuantity(p.id, -1)} className="w-8 h-8 flex items-center justify-center text-green-700 font-black"><i className="fa-solid fa-minus"></i></button>
                        <span className="text-xs font-black text-green-800">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(p.id, 1)} className="w-8 h-8 flex items-center justify-center text-green-700 font-black"><i className="fa-solid fa-plus"></i></button>
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleAddItem(p)}
                       disabled={stock <= 0}
                       className="w-full py-2.5 bg-gray-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-green-700"
                     >
                       Add to Cart
                     </button>
                   )}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary FAB / Checkout Sheet logic... */}
      {cart.length > 0 && !isCheckoutMode && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom-12">
            <button 
                onClick={() => setIsCheckoutMode(true)}
                className="w-full max-w-md mx-auto bg-green-700 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between border-4 border-white/10"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-cart-shopping"></i>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">My Cart ({cart.length} items)</p>
                        <p className="text-lg font-black">₹{grandTotal.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase">Checkout</span>
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                </div>
            </button>
        </div>
      )}

      {/* Checkout Sheet (Unchanged from previous version)... */}
      {isCheckoutMode && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-t-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[95%] overflow-y-auto no-scrollbar">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-800">Finalize Sale</h3>
                <button onClick={() => setIsCheckoutMode(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>

              {/* Customer Selection */}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Bill To Customer</label>
                  <select 
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl shadow-sm text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                  >
                    <option value="">Select Dealer/Retailer...</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div className={`p-4 rounded-3xl border ${selectedCustomer.outstanding > selectedCustomer.creditLimit ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Outstanding Balance</p>
                            <p className={`text-lg font-black ${selectedCustomer.outstanding > selectedCustomer.creditLimit ? 'text-red-600' : 'text-orange-600'}`}>₹{selectedCustomer.outstanding.toLocaleString()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${selectedCustomer.outstanding > selectedCustomer.creditLimit ? 'bg-red-600 text-white' : 'bg-green-100 text-green-700'}`}>
                            {selectedCustomer.outstanding > selectedCustomer.creditLimit ? 'Limit Exceeded' : 'Limit: ₹' + selectedCustomer.creditLimit.toLocaleString()}
                        </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cart Details</p>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">{item.quantity} x ₹{item.rate}</p>
                      </div>
                      <p className="font-black text-gray-900">₹{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 mt-4 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                      <span>Tax (GST)</span>
                      <span>₹{totalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-green-700 pt-2">
                      <span>Total</span>
                      <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PaymentType).map(type => (
                    <button 
                      key={type}
                      onClick={() => setPaymentType(type)}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        paymentType === type ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSaveAndPrint}
                className="w-full py-5 bg-green-700 text-white rounded-[28px] font-black text-lg shadow-2xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-receipt"></i>
                Finalize & Print
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
