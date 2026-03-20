export type UserRole = 'admin' | 'staff' | 'viewer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  contact: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  taxId?: string;
  logoUrl?: string;
  ownerUid: string;
  country?: string;
  state?: string;
  lga?: string;
  subscriptionPlan?: 'free' | 'basic' | 'premium';
  subscriptionExpiry?: string;
  receiptCompanyName?: string;
  receiptMotto?: string;
  receiptTagline?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  totalQuantity: number; // Smallest unit (pieces or units)
  dosageForm: string;
  safetyStock: number;
  businessId: string;
  imageUrl?: string;
  sellType: 'single' | 'pack_piece';
  piecesPerPack?: number;
  sellingPricePerPiece?: number;
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  manufacturingDate: string;
  expirationDate: string;
  quantity: number;
  businessId: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  batchId: string;
  sellUnit: 'unit' | 'pack' | 'piece';
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  discount: number;
  paymentMethod: 'cash' | 'pos' | 'transfer' | 'credit';
  timestamp: any; // Firestore Timestamp
  staffUid: string;
  businessId: string;
  customerDetails?: {
    name: string;
    phone: string;
    amountOwed: number;
  };
  changeAmount?: number;
}

export interface Expense {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  timestamp: any;
  businessId: string;
}
