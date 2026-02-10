
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, User, Invoice, Product, Customer, PaymentType, Payment, StockRequest, RequestStatus, StockMovement, AuditLog } from './types';
import { MOCK_BRANCHES, MOCK_PRODUCTS, MOCK_CUSTOMERS } from './constants';
import Dashboard from './screens/Dashboard';
import Billing from './screens/Billing';
import Inventory from './screens/Inventory';
import Reports from './screens/Reports';
import CustomerLedger from './screens/CustomerLedger';
import BalanceSheet from './screens/BalanceSheet';
import MonthlyStatement from './screens/MonthlyStatement';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './screens/Login';
import AIChat from './components/AIChat';
import PrintPreview from './components/PrintPreview';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoOpenAddDealer, setAutoOpenAddDealer] = useState(false);
  
  const [printData, setPrintData] = useState<{ type: 'INVOICE' | 'STATEMENT' | 'RECEIPT' | 'BALANCE_SHEET' | 'REPORT_LIST', data: any } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [isChatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedInv = localStorage.getItem('eesaa_invoices');
    if (savedInv) setInvoices(JSON.parse(savedInv));
    const savedPay = localStorage.getItem('eesaa_payments');
    if (savedPay) setPayments(JSON.parse(savedPay));
    const savedCust = localStorage.getItem('eesaa_customers');
    if (savedCust) {
      setCustomers(JSON.parse(savedCust));
    } else {
      setCustomers(MOCK_CUSTOMERS);
      localStorage.setItem('eesaa_customers', JSON.stringify(MOCK_CUSTOMERS));
    }
    const savedProducts = localStorage.getItem('eesaa_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(MOCK_PRODUCTS);
      localStorage.setItem('eesaa_products', JSON.stringify(MOCK_PRODUCTS));
    }
    const savedRequests = localStorage.getItem('eesaa_stock_requests');
    if (savedRequests) setStockRequests(JSON.parse(savedRequests));
    const savedMovements = localStorage.getItem('eesaa_stock_movements');
    if (savedMovements) setStockMovements(JSON.parse(savedMovements));
    const savedAudits = localStorage.getItem('eesaa_audit_logs');
    if (savedAudits) setAuditLogs(JSON.parse(savedAudits));
  }, []);

  const triggerPreview = useCallback((type: 'INVOICE' | 'STATEMENT' | 'RECEIPT' | 'BALANCE_SHEET' | 'REPORT_LIST', data: any) => {
    setPrintData({ type, data });
    setShowPreview(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const addAudit = useCallback((action: string, details: string) => {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      user: user?.name || 'System',
      date: new Date().toISOString(),
      details
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      localStorage.setItem('eesaa_audit_logs', JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  const refillStock = useCallback((productId: string, quantity: number) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stockCount: {
              ...p.stockCount,
              FACTORY: (p.stockCount.FACTORY || 0) + quantity
            }
          };
        }
        return p;
      });
      localStorage.setItem('eesaa_products', JSON.stringify(updated));
      return updated;
    });
    const prod = products.find(p => p.id === productId);
    addAudit('STOCK_REFILLED', `Added ${quantity} units of ${prod?.name} to Factory.`);
  }, [products, addAudit]);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => {
      const updated = [invoice, ...prev];
      localStorage.setItem('eesaa_invoices', JSON.stringify(updated));
      return updated;
    });

    setProducts(prevProducts => {
      const updated = prevProducts.map(p => {
        const item = invoice.items.find(i => i.productId === p.id);
        if (item) {
          const currentStock = p.stockCount[invoice.branchId] || 0;
          return {
            ...p,
            stockCount: { ...p.stockCount, [invoice.branchId]: Math.max(0, currentStock - item.quantity) }
          };
        }
        return p;
      });
      localStorage.setItem('eesaa_products', JSON.stringify(updated));
      return updated;
    });

    if (invoice.paymentType === PaymentType.CREDIT) {
      setCustomers(prev => {
        const updated = prev.map(c => 
          c.id === invoice.customerId ? { ...c, outstanding: c.outstanding + invoice.grandTotal } : c
        );
        localStorage.setItem('eesaa_customers', JSON.stringify(updated));
        return updated;
      });
    }
    addAudit('INVOICE_GENERATED', `Inv #${invoice.invoiceNumber} for ₹${invoice.grandTotal}`);
  }, [addAudit]);

  const addPayment = useCallback((payment: Payment) => {
    setPayments(prev => {
      const updated = [payment, ...prev];
      localStorage.setItem('eesaa_payments', JSON.stringify(updated));
      return updated;
    });

    setCustomers(prev => {
      const updated = prev.map(c => 
        c.id === payment.customerId ? { ...c, outstanding: Math.max(0, c.outstanding - payment.amount) } : c
      );
      localStorage.setItem('eesaa_customers', JSON.stringify(updated));
      return updated;
    });
    addAudit('PAYMENT_COLLECTED', `Receipt #${payment.receiptNumber} for ₹${payment.amount}`);
  }, [addAudit]);

  const addCustomer = useCallback((newCustomer: Customer) => {
    setCustomers(prev => {
      const updated = [...prev, newCustomer];
      localStorage.setItem('eesaa_customers', JSON.stringify(updated));
      return updated;
    });
    addAudit('CUSTOMER_ADDED', `New dealer registered: ${newCustomer.name}`);
  }, [addAudit]);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => {
      const updated = prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
      localStorage.setItem('eesaa_customers', JSON.stringify(updated));
      return updated;
    });
    addAudit('CUSTOMER_UPDATED', `Details changed for: ${updatedCustomer.name}`);
  }, [addAudit]);

  const addProduct = useCallback((newProduct: Product) => {
    setProducts(prev => {
      const updated = [...prev, newProduct];
      localStorage.setItem('eesaa_products', JSON.stringify(updated));
      return updated;
    });
    addAudit('PRODUCT_ADDED', `Master created: ${newProduct.name}`);
  }, [addAudit]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem('eesaa_products', JSON.stringify(updated));
      return updated;
    });
    addAudit('PRODUCT_UPDATED', `Master modified: ${updatedProduct.name}`);
  }, [addAudit]);

  const moveStock = useCallback((productId: string, fromBranchId: string, toBranchId: string, quantity: number, type: 'SUPPLY' | 'RETURN') => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const fromStock = p.stockCount[fromBranchId] || 0;
          const toStock = p.stockCount[toBranchId] || 0;
          return {
            ...p,
            stockCount: {
              ...p.stockCount,
              [fromBranchId]: Math.max(0, fromStock - quantity),
              [toBranchId]: toStock + quantity
            }
          };
        }
        return p;
      });
      localStorage.setItem('eesaa_products', JSON.stringify(updated));
      return updated;
    });

    const prod = products.find(p => p.id === productId);
    const fromBranch = MOCK_BRANCHES.find(b => b.id === fromBranchId);
    const toBranch = MOCK_BRANCHES.find(b => b.id === toBranchId);
    
    const movement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName: prod?.name || 'Unknown',
      fromBranch: fromBranchId,
      toBranch: toBranchId,
      fromBranchName: fromBranch?.name || fromBranchId,
      toBranchName: toBranch?.name || toBranchId,
      quantity,
      date: new Date().toISOString(),
      type
    };
    
    setStockMovements(prev => {
      const updated = [movement, ...prev];
      localStorage.setItem('eesaa_stock_movements', JSON.stringify(updated));
      return updated;
    });
    addAudit('STOCK_MOVED', `${quantity} units of ${prod?.name} from ${fromBranch?.name} to ${toBranch?.name}`);
  }, [products, addAudit]);

  const addStockRequest = useCallback((request: StockRequest) => {
    setStockRequests(prev => {
      const updated = [request, ...prev];
      localStorage.setItem('eesaa_stock_requests', JSON.stringify(updated));
      return updated;
    });
    addAudit('STOCK_REQUEST_RAISED', `${request.requestType}: ${request.quantity} units of ${request.productName}`);
  }, [addAudit]);

  const processStockRequest = useCallback((requestId: string, status: RequestStatus) => {
    const request = stockRequests.find(r => r.id === requestId);
    if (!request) return;

    setStockRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? { ...r, status } : r);
      localStorage.setItem('eesaa_stock_requests', JSON.stringify(updated));
      return updated;
    });

    if (status === RequestStatus.APPROVED) {
      if (request.requestType === 'REQUISITION') {
        moveStock(request.productId, 'FACTORY', request.branchId, request.quantity, 'SUPPLY');
      } else {
        moveStock(request.productId, request.branchId, 'FACTORY', request.quantity, 'RETURN');
      }
    }
    
    addAudit('STOCK_REQUEST_PROCESSED', `Request for ${request.productName} ${status}`);
  }, [stockRequests, moveStock, addAudit]);

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    setActiveScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSidebarOpen(false);
  };

  const navigateTo = (screen: string) => {
    if (screen === 'add-dealer') {
        setActiveScreen('customers');
        setAutoOpenAddDealer(true);
    } else {
        setActiveScreen(screen);
        setAutoOpenAddDealer(false);
    }
    setSidebarOpen(false);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard user={user} invoices={invoices} products={products} payments={payments} onNavigate={navigateTo} />;
      case 'billing': return <Billing user={user} products={products} customers={customers} onSave={addInvoice} onPrint={triggerPreview} />;
      case 'inventory': return <Inventory 
        user={user} 
        products={products} 
        branches={MOCK_BRANCHES} 
        requests={stockRequests}
        movements={stockMovements}
        onAddProduct={addProduct}
        onUpdateProduct={updateProduct}
        onRefillStock={refillStock}
        onSupply={(pid, bid, qty) => moveStock(pid, 'FACTORY', bid, qty, 'SUPPLY')}
        onRaiseRequest={addStockRequest}
        onProcessRequest={processStockRequest}
      />;
      case 'reports': return <Reports user={user} invoices={invoices} branches={MOCK_BRANCHES} products={products} onPrint={triggerPreview} />;
      case 'customers': return <CustomerLedger 
        user={user} 
        customers={customers} 
        invoices={invoices} 
        payments={payments} 
        onAddPayment={addPayment} 
        onAddCustomer={addCustomer} 
        onUpdateCustomer={updateCustomer} 
        onPrintReceipt={(p) => triggerPreview('RECEIPT', { payment: p, customer: customers.find(c => c.id === p.customerId) })}
        onPrintLedger={triggerPreview}
        initialAddOpen={autoOpenAddDealer}
      />;
      case 'balance_sheet': return <BalanceSheet user={user} invoices={invoices} payments={payments} branches={MOCK_BRANCHES} products={products} onPrint={triggerPreview} />;
      case 'statement': return <MonthlyStatement user={user} customers={customers} invoices={invoices} payments={payments} branches={MOCK_BRANCHES} onPrint={triggerPreview} />;
      default: return <Dashboard user={user} invoices={invoices} products={products} payments={payments} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 max-w-md mx-auto relative border-x border-slate-200 shadow-2xl">
      <Header user={user} onMenuClick={() => setSidebarOpen(true)} isOnline={isOnline} activeScreen={activeScreen} />
      
      <div className="flex-1 overflow-y-auto no-scrollbar no-print">
        {renderScreen()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-effect flex justify-around items-center py-4 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] safe-bottom z-40 no-print rounded-t-[3rem] border-t border-white/50">
        <NavBtn icon="fa-house-chimney" label="Home" active={activeScreen === 'dashboard'} onClick={() => navigateTo('dashboard')} />
        <NavBtn icon="fa-calculator" label="POS" active={activeScreen === 'billing'} onClick={() => navigateTo('billing')} />
        
        <div className="relative -top-8">
           <button 
             onClick={() => setChatOpen(true)} 
             className="mesh-gradient text-white w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform premium-shadow-lg"
           >
             <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
           </button>
        </div>
        
        <NavBtn icon="fa-id-card" label="Dealers" active={activeScreen === 'customers'} onClick={() => navigateTo('customers')} />
        <NavBtn icon="fa-cubes" label="Stock" active={activeScreen === 'inventory'} onClick={() => navigateTo('inventory')} />
      </div>
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} user={user} onLogout={handleLogout} onNav={navigateTo} activeScreen={activeScreen} />
      {isChatOpen && <AIChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ user, invoices, products, payments, stockRequests }} />}

      {/* Preview Modal for Printable Content */}
      {showPreview && printData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 no-print animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg h-[90%] rounded-[3rem] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <header className="p-8 bg-white border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Document View</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Ready for Print or Share</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
               <div className="bg-white shadow-2xl mx-auto transform scale-[0.85] origin-top rounded-lg overflow-hidden border border-slate-200">
                  <PrintPreview 
                    type={printData.type} 
                    data={printData.data} 
                    branch={MOCK_BRANCHES.find(b => b.id === (user?.branchId || 'FACTORY')) || MOCK_BRANCHES[0]} 
                  />
               </div>
            </div>
            <footer className="p-8 bg-white border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowPreview(false)}
                className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px]"
              >
                Close
              </button>
              <button 
                onClick={handlePrint}
                className="flex-[2] py-5 premium-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-print"></i>
                PROCESS PRINT
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Actual Printable Area */}
      <div className="print-area">
        {printData && (
          <PrintPreview 
            type={printData.type} 
            data={printData.data} 
            branch={MOCK_BRANCHES.find(b => b.id === (user?.branchId || 'FACTORY')) || MOCK_BRANCHES[0]} 
          />
        )}
      </div>
    </div>
  );
};

const NavBtn: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
    <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-emerald-50' : 'bg-transparent'}`}>
        <i className={`fa-solid ${icon} text-lg`}></i>
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
