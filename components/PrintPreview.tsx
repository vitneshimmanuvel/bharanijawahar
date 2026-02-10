
import React from 'react';
import { Invoice, Branch, Customer, Payment } from '../types';

interface PrintPreviewProps {
  type: 'INVOICE' | 'STATEMENT' | 'RECEIPT' | 'BALANCE_SHEET' | 'REPORT_LIST';
  data: any;
  branch: Branch;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ type, data, branch }) => {
  if (type === 'INVOICE') {
    const inv = data as Invoice;
    return (
      <div className="bg-white p-8 text-black font-sans max-w-2xl mx-auto border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-green-700">EESAA WEIGHING SCALES</h1>
          <p className="text-sm font-bold">{branch.name}</p>
          <p className="text-[10px] uppercase">{branch.location}</p>
          <p className="text-[10px] font-bold">GSTIN: {branch.gstin}</p>
        </div>

        <div className="flex justify-between mb-8 border-b border-gray-200 pb-4">
          <div className="text-xs">
            <p className="font-black text-gray-400 uppercase text-[9px]">Bill To:</p>
            <p className="font-bold text-base">{inv.customerName}</p>
            <p className="mt-1">Invoice ID: {inv.invoiceNumber}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-black text-gray-400 uppercase text-[9px]">Date:</p>
            <p className="font-bold">{new Date(inv.date).toLocaleDateString()}</p>
            <p className="mt-1 uppercase">Mode: {inv.paymentType}</p>
          </div>
        </div>

        <table className="w-full text-xs mb-8">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Tax</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 font-bold">{item.productName}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">₹{item.rate.toLocaleString()}</td>
                <td className="py-3 text-right">₹{item.tax.toLocaleString()}</td>
                <td className="py-3 text-right font-black">₹{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Subtotal</span>
              <span className="font-bold">₹{inv.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold uppercase text-[10px]">GST Total</span>
              <span className="font-bold">₹{inv.totalTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t-2 border-black pt-2">
              <span className="font-black uppercase text-[12px]">Grand Total</span>
              <span className="font-black text-xl">₹{inv.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-end">
          <div className="text-[9px] text-gray-400">
            <p>E.& O.E.</p>
            <p>Subject to Ahmedabad jurisdiction.</p>
          </div>
          <div className="text-center border-t border-black w-40 pt-2">
            <p className="text-[10px] font-bold">Authorized Signatory</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'RECEIPT') {
    const { payment, customer } = data as { payment: Payment, customer: Customer };
    return (
      <div className="bg-white p-12 text-black font-sans max-w-xl mx-auto border-4 border-double border-gray-300">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-gray-900">PAYMENT RECEIPT</h1>
          <h2 className="text-lg font-bold text-green-700">EESAA WEIGHING SCALES</h2>
          <p className="text-[10px] font-bold mt-1">{branch.name}</p>
          <p className="text-[9px] uppercase">{branch.location}</p>
        </div>

        <div className="space-y-6 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-black text-gray-400 uppercase text-[10px]">Receipt No:</span>
            <span className="font-black">{payment.receiptNumber}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-black text-gray-400 uppercase text-[10px]">Date:</span>
            <span className="font-bold">{new Date(payment.date).toLocaleDateString()}</span>
          </div>
          
          <div className="py-4 border-y-2 border-gray-100 bg-gray-50/50 px-4 rounded-xl">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Received From:</p>
            <p className="text-lg font-black">{customer.name}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{customer.address}</p>
            <p className="text-xs font-bold text-gray-500">Contact: {customer.mobile}</p>
          </div>

          <div className="flex justify-between items-end pt-4">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Payment Mode</p>
              <p className="text-base font-black text-indigo-700 uppercase">{payment.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase">Amount Received</p>
              <p className="text-4xl font-black text-green-700">₹{payment.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400">Current Outstanding Balance: <span className="text-red-600 font-black">₹{customer.outstanding.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="mt-20 flex justify-between items-end">
          <div className="text-[8px] text-gray-300 italic">
            This is an official payment confirmation.<br/>
            EESAA Scales Management System.
          </div>
          <div className="w-40 border-t border-black text-center pt-2">
             <p className="text-[10px] font-black uppercase tracking-widest">Receiver Sign</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'STATEMENT') {
    const { customer, totals, transactions, month } = data;
    return (
      <div className="bg-white p-8 text-black font-sans">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black">EESAA SCALES - ACCOUNT STATEMENT</h1>
          <p className="text-sm font-bold uppercase">{new Date(month).toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-black pb-6">
          <div className="text-xs">
            <p className="text-[9px] font-black text-gray-400 uppercase">Customer Details</p>
            <p className="text-lg font-black">{customer.name}</p>
            <p>{customer.address}</p>
            <p>Mobile: {customer.mobile}</p>
          </div>
          <div className="text-right text-xs">
            <p className="text-[9px] font-black text-gray-400 uppercase">Branch</p>
            <p className="font-bold">{branch.name}</p>
            <p>Closing Balance: ₹{customer.outstanding.toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full text-[11px] mb-12">
          <thead className="border-b border-black">
            <tr className="text-left">
              <th className="py-2">Date</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Debit (₹)</th>
              <th className="py-2 text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-3">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-3 font-medium">{t.desc}</td>
                <td className="py-3 text-right">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
                <td className="py-3 text-right">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black font-black">
            <tr>
              <td className="py-4" colSpan={2}>MONTHLY TOTALS</td>
              <td className="py-4 text-right">₹{totals.debit.toLocaleString()}</td>
              <td className="py-4 text-right">₹{totals.credit.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="text-center italic text-gray-400 text-[10px] mt-20">
          This is a computer generated statement and does not require a physical signature.
        </div>
      </div>
    );
  }

  if (type === 'BALANCE_SHEET') {
    const { assets, liabilities, equity, branchBreakdown } = data;
    return (
      <div className="bg-white p-8 text-black font-sans">
        <div className="text-center mb-10 border-b-4 border-green-700 pb-6">
          <h1 className="text-3xl font-black text-green-700">EESAA WEIGHING SCALES</h1>
          <h2 className="text-xl font-bold uppercase mt-1">Consolidated Balance Sheet</h2>
          <p className="text-xs font-medium text-gray-500 mt-1">As of {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Assets Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-black border-b-2 border-black pb-1">ASSETS</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Current Assets</p>
                <div className="space-y-1 mt-1 ml-2">
                  <div className="flex justify-between">
                    <span>Cash & Cash Equivalents</span>
                    <span className="font-bold">₹{assets.cashOnHand.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accounts Receivable</span>
                    <span className="font-bold">₹{assets.accountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory Assets</span>
                    <span className="font-bold">₹{assets.inventoryValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Fixed Assets</p>
                <div className="space-y-1 mt-1 ml-2">
                  <div className="flex justify-between">
                    <span>Gross Fixed Assets</span>
                    <span className="font-bold">₹{assets.grossFixedAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Accumulated Depreciation</span>
                    <span className="font-bold">-₹{assets.accumulatedDepreciation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-100 pt-1">
                    <span>Net Fixed Assets</span>
                    <span>₹{assets.netFixedAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t-2 border-black font-black">
                <span>TOTAL ASSETS</span>
                <span>₹{assets.totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h3 className="text-lg font-black border-b-2 border-black pb-1">LIABILITIES</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Taxes Payable (GST)</span>
                  <span className="font-bold">₹{liabilities.taxPayable.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier Payables</span>
                  <span className="font-bold">₹{liabilities.supplierPayables.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operational Liabilities</span>
                  <span className="font-bold">₹{liabilities.otherLiabilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200 font-black">
                  <span>TOTAL LIABILITIES</span>
                  <span>₹{liabilities.totalLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black border-b-2 border-black pb-1">EQUITY</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between font-black text-green-700">
                  <span>OWNER'S EQUITY</span>
                  <span>₹{equity.totalEquity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200 font-black">
                  <span>TOTAL LIAB. & EQUITY</span>
                  <span>₹{(liabilities.totalLiabilities + equity.totalEquity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Summary Section */}
        <div className="mt-12">
          <h3 className="text-md font-black border-b border-gray-200 mb-4 pb-1 uppercase tracking-widest text-gray-500">Branch Asset Allocation</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2">Branch Name</th>
                <th className="py-2 text-right">Sales Volume</th>
                <th className="py-2 text-right">O/S Receivable</th>
                <th className="py-2 text-right">Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {branchBreakdown.map((b: any) => (
                <tr key={b.name} className="border-b border-gray-50">
                  <td className="py-2 font-bold">{b.name}</td>
                  <td className="py-2 text-right">₹{b.sales.toLocaleString()}</td>
                  <td className="py-2 text-right">₹{b.outstanding.toLocaleString()}</td>
                  <td className="py-2 text-right">₹{b.inventory.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-20 flex justify-between">
          <div className="text-[10px] text-gray-400">
            <p>Statement prepared by EESAA Smart System</p>
            <p>Run Time: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="w-48 border-t border-black pt-2 text-center text-xs font-black">
            Financial Controller Signature
          </div>
        </div>
      </div>
    );
  }

  if (type === 'REPORT_LIST') {
    const invoices = data as Invoice[];
    const total = invoices.reduce((s, i) => s + i.grandTotal, 0);
    return (
      <div className="bg-white p-8 text-black font-sans">
         <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black">EESAA SALES SUMMARY REPORT</h1>
            <p className="text-sm font-bold uppercase">Consolidated Transactions</p>
            <p className="text-[9px] text-gray-400 mt-1">Exported on: {new Date().toLocaleString()}</p>
         </div>

         <table className="w-full text-[10px]">
           <thead>
             <tr className="border-b border-black text-left font-black">
               <th className="py-2">Date</th>
               <th className="py-2">Invoice #</th>
               <th className="py-2">Customer</th>
               <th className="py-2">Mode</th>
               <th className="py-2 text-right">Grand Total (₹)</th>
             </tr>
           </thead>
           <tbody>
             {invoices.map(inv => (
               <tr key={inv.id} className="border-b border-gray-100">
                 <td className="py-2">{new Date(inv.date).toLocaleDateString()}</td>
                 <td className="py-2 font-bold">{inv.invoiceNumber}</td>
                 <td className="py-2">{inv.customerName}</td>
                 <td className="py-2 uppercase">{inv.paymentType}</td>
                 <td className="py-2 text-right font-black">₹{inv.grandTotal.toLocaleString()}</td>
               </tr>
             ))}
           </tbody>
           <tfoot>
             <tr className="font-black text-sm">
                <td className="py-6" colSpan={4}>TOTAL SETTLEMENTS</td>
                <td className="py-6 text-right text-green-700">₹{total.toLocaleString()}</td>
             </tr>
           </tfoot>
         </table>

         <div className="mt-20 text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4 italic">
            Confidential Enterprise Report. Restricted for internal EESAA use only.
         </div>
      </div>
    );
  }

  return null;
};

export default PrintPreview;
