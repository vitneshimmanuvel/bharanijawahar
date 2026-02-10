
import React from 'react';
import { UserRole, Branch, Product, Customer } from './types';

export const EESAA_GREEN = '#064e3b';
export const EESAA_ACCENT = '#10b981';

export const MOCK_BRANCHES: Branch[] = [
  { id: 'FACTORY', name: 'Head Office (Factory)', location: 'Industrial Area, Phase 2', gstin: '24AAAAA0000A1Z5' },
  { id: 'B1', name: 'Ahmedabad Branch', location: 'Navrangpura', gstin: '24AAAAA1111A1Z5' },
  { id: 'B2', name: 'Rajkot Branch', location: 'GIDC', gstin: '24AAAAA2222A1Z5' },
  { id: 'B3', name: 'Surat Branch', location: 'Varachha', gstin: '24AAAAA3333A1Z5' },
  { id: 'B4', name: 'Vadodara Branch', location: 'Sayajiganj', gstin: '24AAAAA4444A1Z5' },
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'P1', 
    name: 'EESAA TT-Series (Commercial)', 
    sku: 'TT-PRO-30', 
    category: 'Commercial', 
    unit: 'PCS', 
    rate: 5200, 
    taxPercent: 18, 
    minStock: 20, 
    imageUrl: 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?auto=format&fit=crop&q=80&w=600',
    stockCount: { FACTORY: 100, B1: 5, B2: 8, B3: 20, B4: 5 } // B1 is Low (5 < 20)
  },
  { 
    id: 'P2', 
    name: 'EESAA Heavy Platform Scale', 
    sku: 'PS-PLAT-500', 
    category: 'Industrial', 
    unit: 'PCS', 
    rate: 18500, 
    taxPercent: 18, 
    minStock: 10, 
    imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb28c?auto=format&fit=crop&q=80&w=600',
    stockCount: { FACTORY: 50, B1: 0, B2: 2, B3: 10, B4: 1 } // B1 is Out of Stock
  },
  { 
    id: 'P7', 
    name: 'EESAA Mainboard Spare Kit', 
    sku: 'MB-KIT-V2', 
    category: 'Spares', 
    unit: 'KIT', 
    rate: 2800, 
    taxPercent: 18, 
    minStock: 50, 
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    stockCount: { FACTORY: 300, B1: 50, B2: 30, B3: 60, B4: 20 } // B2 is Low
  },
  { 
    id: 'P3', 
    name: 'Precision Scale - 600g', 
    sku: 'JS-600', 
    category: 'Precision', 
    unit: 'PCS', 
    rate: 3200, 
    taxPercent: 18, 
    minStock: 15, 
    imageUrl: 'https://images.unsplash.com/photo-1589146142504-26612d7c5f87?auto=format&fit=crop&q=80&w=400',
    stockCount: { FACTORY: 200, B1: 30, B2: 25, B3: 40, B4: 10 } 
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C1', name: 'Radhe Electronics', mobile: '9876543210', address: 'Plot 42, GIDC Sector 10, Ahmedabad', outstanding: 15400, creditLimit: 50000 },
  { id: 'C2', name: 'Shakti Metals', mobile: '9988776655', address: 'B-201, Industrial Plaza, Rajkot', gst: '24BBBBB0000B1Z5', outstanding: 2500, creditLimit: 20000 },
  { id: 'C3', name: 'Pooja Kirana Store', mobile: '9123456789', address: 'Main Bazar, Near Bus Stop, Surat', outstanding: 0, creditLimit: 10000 },
];
