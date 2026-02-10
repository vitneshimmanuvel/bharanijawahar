
export enum UserRole {
  FACTORY_ADMIN = 'FACTORY_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  SALES_STAFF = 'SALES_STAFF'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branchId: string | null;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  gstin: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  rate: number;
  taxPercent: number;
  minStock: number;
  imageUrl?: string;
  stockCount: Record<string, number>; // branchId -> count, 'FACTORY' is the hub
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  gst?: string;
  outstanding: number;
  creditLimit: number;
}

export enum PaymentType {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK = 'BANK',
  CREDIT = 'CREDIT'
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  tax: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  branchId: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  paymentType: PaymentType;
  outstandingAtTime: number;
  isSynced: boolean;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  date: string;
  customerId: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK';
  notes?: string;
  branchId: string;
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface StockRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  branchId: string;
  branchName: string;
  date: string;
  status: RequestStatus;
  requestType: 'REQUISITION' | 'RETURN'; // REQUISITION = to branch, RETURN = to factory
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  fromBranch: string; 
  toBranch: string; 
  fromBranchName: string;
  toBranchName: string;
  quantity: number;
  date: string;
  type: 'SUPPLY' | 'SALE' | 'RETURN';
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  date: string;
  details: string;
}
