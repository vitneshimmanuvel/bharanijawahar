
import React, { useState, useMemo } from 'react';
import { User, Product, Branch, UserRole, StockRequest, RequestStatus, StockMovement } from '../types';

interface InventoryProps {
  user: User;
  products: Product[];
  branches: Branch[];
  requests: StockRequest[];
  movements: StockMovement[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onRefillStock: (pid: string, qty: number) => void;
  onSupply: (pid: string, bid: string, qty: number) => void;
  onRaiseRequest: (req: StockRequest) => void;
  onProcessRequest: (rid: string, status: RequestStatus) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  user, products, branches, requests, movements, 
  onAddProduct, onUpdateProduct, onRefillStock, onSupply, onRaiseRequest, onProcessRequest 
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'REQUESTS' | 'MOVEMENTS'>('STOCK');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSupplying, setIsSupplying] = useState<{product: Product} | null>(null);
  const [isRefilling, setIsRefilling] = useState<{product: Product} | null>(null);
  const [isCorrecting, setIsCorrecting] = useState<{product: Product} | null>(null);
  const [showOnlyLow, setShowOnlyLow] = useState(false);
  
  const [refillQty, setRefillQty] = useState('50');
  const [correctionQty, setCorrectionQty] = useState('0');
  
  // New Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    category: 'Commercial',
    rate: '',
    tax: '18',
    minStock: '10',
    imageUrl: 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?auto=format&fit=crop&q=80&w=600'
  });

  const [supplyQty, setSupplyQty] = useState('5');
  const [supplyBranch, setSupplyBranch] = useState(branches[1]?.id || '');

  const filteredProducts = useMemo(() => {
    let list = products;
    if (showOnlyLow) {
      list = list.filter(p => (p.stockCount[user.branchId || 'FACTORY'] || 0) < p.minStock);
    }
    return list;
  }, [products, showOnlyLow, user.branchId]);

  const handleAddProduct = () => {
    if (!newProd.name || !newProd.sku || !newProd.rate) return;
    
    const product: Product = {
      id: 'P' + Date.now(),
      name: newProd.name,
      sku: newProd.sku,
      category: newProd.category,
      unit: 'PCS',
      rate: parseFloat(newProd.rate),
      taxPercent: parseFloat(newProd.tax),
      minStock: parseInt(newProd.minStock),
      imageUrl: newProd.imageUrl,
      stockCount: { FACTORY: 0 }
    };

    onAddProduct(product);
    setIsAddingProduct(false);
    setNewProd({ name: '', sku: '', category: 'Commercial', rate: '', tax: '18', minStock: '10', imageUrl: 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?auto=format&fit=crop&q=80&w=600' });
  };

  const handleSupply = () => {
    if (!isSupplying || !supplyQty || !supplyBranch) return;
    onSupply(isSupplying.product.id, supplyBranch, parseInt(supplyQty));
    setIsSupplying(null);
  };

  const handleRefillHub = () => {
      if (!isRefilling || !refillQty) return;
      onRefillStock(isRefilling.product.id, parseInt(refillQty));
      setIsRefilling(null);
      setRefillQty('50');
  };

  const handleCorrection = () => {
    if (!isCorrecting) return;
    const updated = {
      ...isCorrecting.product,
      stockCount: {
        ...isCorrecting.product.stockCount,
        [user.branchId || 'FACTORY']: parseInt(correctionQty)
      }
    };
    onUpdateProduct(updated);
    setIsCorrecting(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tabs and Filter Bar */}
      <div className="bg-white px-4 pt-4 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
            <div className="flex gap-6">
                {['STOCK', 'REQUESTS', 'MOVEMENTS'].map((t) => (
                    <button 
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${
                        activeTab === t ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-gray-400'
                    }`}
                    >
                    {t}
                    </button>
                ))}
            </div>
            {activeTab === 'STOCK' && (
                <button 
                  onClick={() => setShowOnlyLow(!showOnlyLow)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${showOnlyLow ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  <i className="fa-solid fa-filter"></i>
                  {showOnlyLow ? 'LOW STOCK ONLY' : 'ALL STOCK'}
                </button>
            )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto no-scrollbar pb-32">
        {activeTab === 'STOCK' && (
          <div className="space-y-4">
            {filteredProducts.map((p, idx) => {
              const currentBranchId = user.branchId || 'FACTORY';
              const stock = p.stockCount[currentBranchId] || 0;
              const isLow = stock < p.minStock;

              return (
                <div key={p.id} className={`bg-white rounded-[32px] p-5 shadow-sm border transition-all duration-500 flex items-center gap-4 animate-in slide-in-from-bottom-4 ${isLow ? 'border-amber-200 shadow-amber-50 ring-2 ring-amber-100/50' : 'border-gray-100'}`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-800 leading-tight">{p.name}</h4>
                        {isLow && <span className="text-[7px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Low</span>}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.sku}</p>
                    
                    <div className="mt-2">
                      <p className={`text-[12px] font-black leading-none ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {stock} AVAILABLE
                      </p>
                      <p className="text-[8px] text-slate-300 font-black uppercase mt-1 tracking-tighter">Threshold: {p.minStock}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.role === UserRole.FACTORY_ADMIN && (
                        <>
                        <button 
                            onClick={() => { setIsCorrecting({ product: p }); setCorrectionQty(stock.toString()); }}
                            className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            title="Correct Inventory"
                        >
                            <i className="fa-solid fa-screwdriver-wrench"></i>
                        </button>
                        <button 
                            onClick={() => setIsRefilling({ product: p })}
                            className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-slate-900/10"
                            title="Refill Hub Stock"
                        >
                            <i className="fa-solid fa-plus-square"></i>
                        </button>
                        <button 
                            onClick={() => setIsSupplying({ product: p })}
                            className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center active:scale-90 transition-transform border border-emerald-100"
                            title="Supply to Branch"
                        >
                            <i className="fa-solid fa-truck-ramp-box"></i>
                        </button>
                        </>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
                <div className="py-20 text-center opacity-20">
                    <i className="fa-solid fa-boxes-stacked text-6xl mb-4"></i>
                    <p className="font-black text-lg">Inventory clear</p>
                </div>
            )}
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
               <div className="py-20 text-center opacity-20">
                 <i className="fa-solid fa-clipboard-list text-6xl mb-4"></i>
                 <p className="font-black text-lg">No pending requests</p>
               </div>
            ) : (
              requests.map((req, idx) => (
                <div key={req.id} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">From: {req.branchName}</span>
                       <h4 className="text-sm font-black text-gray-800">{req.productName}</h4>
                     </div>
                     <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                       req.status === RequestStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 
                       req.status === RequestStatus.REJECTED ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                     }`}>
                       {req.status}
                     </span>
                   </div>
                   <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-[9px] font-bold text-gray-500">Qty Requested: <span className="text-gray-900 font-black">{req.quantity}</span></p>
                        <p className="text-[8px] text-gray-400 mt-1">{new Date(req.date).toLocaleDateString()}</p>
                      </div>
                      {user.role === UserRole.FACTORY_ADMIN && req.status === RequestStatus.PENDING && (
                        <div className="flex gap-2">
                           <button onClick={() => onProcessRequest(req.id, RequestStatus.REJECTED)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase">Deny</button>
                           <button onClick={() => onProcessRequest(req.id, RequestStatus.APPROVED)} className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/10">Approve</button>
                        </div>
                      )}
                   </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'MOVEMENTS' && (
           <div className="space-y-4">
             {movements.map((m, idx) => (
               <div key={m.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'SUPPLY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <i className={`fa-solid ${m.type === 'SUPPLY' ? 'fa-arrow-right-long' : 'fa-rotate-left'}`}></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm tracking-tight">{m.productName}</h5>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{m.fromBranchName} → {m.toBranchName}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-gray-900 text-sm">{m.quantity} Unit(s)</p>
                    <p className="text-[8px] text-gray-400 font-bold">{new Date(m.date).toLocaleDateString()}</p>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Correct Inventory Modal */}
      {isCorrecting && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Stock Correction</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Manual Audit Adjustments</p>
              
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black text-slate-800">{isCorrecting.product.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Editing Branch: {user.branchId || 'FACTORY'}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">New Absolute Count</label>
                  <input 
                    type="number" 
                    value={correctionQty} 
                    onChange={(e) => setCorrectionQty(e.target.value)} 
                    className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 text-xl text-center"
                    placeholder="Set final stock"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-8">
                <button onClick={() => setIsCorrecting(null)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleCorrection} className="flex-[2] py-5 bg-amber-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Save Correction</button>
              </div>
           </div>
        </div>
      )}

      {/* Refill Hub Modal */}
      {isRefilling && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Hub Stock Refill</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-6">Central Factory Inventory</p>
              
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200">
                        <img src={isRefilling.product.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800">{isRefilling.product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">Current Factory Stock: {isRefilling.product.stockCount['FACTORY'] || 0}</p>
                    </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Quantity to Add</label>
                  <div className="flex gap-2 mb-4">
                      {['10', '50', '100'].map(q => (
                          <button key={q} onClick={() => setRefillQty(q)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${refillQty === q ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-slate-400 border-slate-100'}`}>{q}</button>
                      ))}
                  </div>
                  <input 
                    type="number" 
                    value={refillQty} 
                    onChange={(e) => setRefillQty(e.target.value)} 
                    className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 text-xl text-center"
                    placeholder="Custom quantity"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-8">
                <button onClick={() => setIsRefilling(null)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleRefillHub} className="flex-[2] py-5 bg-emerald-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Hub Stock</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Product FAB */}
      {user.role === UserRole.FACTORY_ADMIN && activeTab === 'STOCK' && (
        <button 
          onClick={() => setIsAddingProduct(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-30 border-4 border-white premium-shadow"
        >
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      )}

      {/* Supply Modal */}
      {isSupplying && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Branch Supply</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{isSupplying.product.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Target Branch</label>
                  <select 
                    value={supplyBranch} 
                    onChange={(e) => setSupplyBranch(e.target.value)}
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    {branches.filter(b => b.id !== 'FACTORY').map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Quantity</label>
                  <input 
                    type="number" 
                    value={supplyQty} 
                    onChange={(e) => setSupplyQty(e.target.value)} 
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-8">
                <button onClick={() => setIsSupplying(null)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
                <button onClick={handleSupply} className="flex-[2] py-4 bg-emerald-900 text-white rounded-2xl font-black shadow-xl">Process Supply</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[95%] overflow-y-auto no-scrollbar">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">Master Catalog</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Product Name</label>
                  <input type="text" value={newProd.name} onChange={(e) => setNewProd({...newProd, name: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500" placeholder="EESAA TT-Series..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">SKU Code</label>
                    <input type="text" value={newProd.sku} onChange={(e) => setNewProd({...newProd, sku: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700" placeholder="SKU-123" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Category</label>
                    <select value={newProd.category} onChange={(e) => setNewProd({...newProd, category: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700">
                      <option>Commercial</option>
                      <option>Industrial</option>
                      <option>Precision</option>
                      <option>Spares</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Base Rate (₹)</label>
                    <input type="number" value={newProd.rate} onChange={(e) => setNewProd({...newProd, rate: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Min. Alert Level</label>
                    <input type="number" value={newProd.minStock} onChange={(e) => setNewProd({...newProd, minStock: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Image URL</label>
                  <input type="text" value={newProd.imageUrl} onChange={(e) => setNewProd({...newProd, imageUrl: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-gray-700 text-xs" />
                </div>
              </div>

              <div className="flex gap-2 pt-8">
                <button onClick={() => setIsAddingProduct(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleAddProduct} className="flex-[2] py-5 bg-emerald-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Create Master</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
