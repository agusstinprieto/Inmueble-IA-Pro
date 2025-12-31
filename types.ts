
// ==========================================
// INMUEBLE IA PRO - Sistema de Tipos
// ==========================================

// ============ ENUMS ============

export enum PropertyType {
  CASA = 'CASA',
  DEPARTAMENTO = 'DEPARTAMENTO',
  TERRENO = 'TERRENO',
  LOCAL = 'LOCAL',
  OFICINA = 'OFICINA',
  BODEGA = 'BODEGA',
  RANCHO = 'RANCHO',
  EDIFICIO = 'EDIFICIO'
}

export enum OperationType {
  VENTA = 'VENTA',
  RENTA = 'RENTA',
  TRASPASO = 'TRASPASO'
}

export enum PropertyStatus {
  DISPONIBLE = 'DISPONIBLE',
  APARTADA = 'APARTADA',
  VENDIDA = 'VENDIDA',
  RENTADA = 'RENTADA'
}

export enum ClientStatus {
  NUEVO = 'NUEVO',
  CONTACTADO = 'CONTACTADO',
  EN_NEGOCIACION = 'EN_NEGOCIACION',
  CERRADO = 'CERRADO',
  PERDIDO = 'PERDIDO'
}

export enum ContractType {
  COMPRAVENTA = 'COMPRAVENTA',
  ARRENDAMIENTO = 'ARRENDAMIENTO',
  PROMESA = 'PROMESA'
}

// ============ INTERFACES ============

export interface Address {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  colony: string;
  city: string;
  state: string;
  zipCode: string;
  country: 'MEXICO' | 'USA';
  lat?: number;
  lng?: number;
}

export interface PropertySpecs {
  m2Total: number;
  m2Built: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  parking: number;
  floors: number;
  yearBuilt?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  operation: OperationType;
  address: Address;
  coordinates?: { lat: number; lng: number };
  specs: PropertySpecs;
  amenities: string[];
  salePrice?: number;
  rentPrice?: number;
  currency: 'MXN' | 'USD';
  pricePerM2?: number;
  maintenanceFee?: number;
  status: PropertyStatus;
  agentId: string;
  agencyId: string;
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  dateAdded: string;
  dateUpdated?: string;
  views: number;
  favorites: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interest: OperationType;
  preferredTypes: PropertyType[];
  budgetMin: number;
  budgetMax: number;
  preferredZones: string[];
  notes: string;
  agentId: string;
  status: ClientStatus;
  followUps: FollowUp[];
  viewedProperties: string[];
  dateAdded: string;
  source?: string; // Facebook, WhatsApp, Portal, etc.
}

export interface FollowUp {
  id: string;
  date: string;
  type: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
  notes: string;
  completed: boolean;
  scheduledDate?: string;
  nextFollowUp?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  agencyId: string;
  properties: string[];
  clients: string[];
  sales: Sale[];
  commission: number; // Percentage
  dateJoined: string;
  active: boolean;
}

export interface Agency {
  id: string;
  name: string;
  logo?: string;
  phone: string;
  email: string;
  address: Address;
  agents: string[];
  properties: string[];
  primaryColor: string;
  dateCreated: string;
}

export interface Sale {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  type: OperationType;
  finalPrice: number;
  commission: number;
  dateClosed: string;
  contractId?: string;
}

export interface Contract {
  id: string;
  type: ContractType;
  propertyId: string;
  clientId: string;
  agentId: string;
  startDate: string;
  endDate?: string;
  amount: number;
  deposit?: number;
  terms: string;
  pdfUrl?: string;
  signed: boolean;
  dateCreated: string;
}

// ============ ANALYSIS TYPES (IA) ============

export interface PropertyAnalysis {
  type: PropertyType;
  estimatedSpecs: PropertySpecs;
  condition: 'NUEVA' | 'EXCELENTE' | 'BUENA' | 'REGULAR' | 'REQUIERE_REPARACION';
  detectedAmenities: string[];
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  marketComparison: string;
  suggestions: string[];
}

export interface AnalysisResult {
  properties: PropertyAnalysis[];
}

// ============ MARKET COMPARISON ============

export interface MarketProperty {
  title: string;
  price: number;
  m2: number;
  pricePerM2: number;
  source: string;
  url: string;
  location: string;
  similarity: number; // 0-100
}

export interface MarketAnalysis {
  averagePrice: number;
  averagePricePerM2: number;
  priceRange: { min: number; max: number };
  comparableProperties: MarketProperty[];
  recommendation: string;
}

// ============ MORTGAGE CALCULATOR ============

export interface MortgageParams {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
}

// ============ ANALYTICS ============

export interface DashboardMetrics {
  totalProperties: number;
  availableProperties: number;
  propertiesByType: Record<PropertyType, number>;
  totalClients: number;
  activeClients: number;
  monthlySales: number;
  monthlyRevenue: number;
  monthlyCommissions: number;
  conversionRate: number;
  avgDaysToSell: number;
  topAgents: { agentId: string; sales: number; revenue: number }[];
}

// ============ IMPORT ============

export interface ImportedProperty {
  source: string;
  externalId: string;
  url: string;
  rawData: any;
  property: Partial<Property>;
  imported: boolean;
}
