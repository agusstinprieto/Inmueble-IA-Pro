
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

export enum ClientSegment {
  VIP = 'VIP',           // High budget, high interest
  HOT = 'HOT',           // Ready to close, recent activity
  WARM = 'WARM',         // Interested, but in research phase
  COLD = 'COLD',         // No response or inactive
  NEW = 'NEW'            // Just registered
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
  pros?: string[];
  cons?: string[];
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
  status: ClientStatus;
  agentId: string;
  agencyId: string;
  branchId?: string;
  followUps: FollowUp[];
  viewedProperties: string[];
  dateAdded: string;
  source?: string; // Facebook, WhatsApp, Portal, etc.
  segment?: ClientSegment;
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

// ============ SAAS B2B TYPES ============

export type UserRole = 'super_admin' | 'agency_owner' | 'branch_manager' | 'agent';

export interface Profile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  agencyId?: string;
  branchId?: string;
  photoUrl?: string;
  phone?: string;
  commission?: number;
  active?: boolean;
}

export interface Agency {
  id: string;
  ownerId: string;
  name: string;
  logoUrl?: string;
  brandColor: string;
  location?: string; // e.g., "Torreón, Coahuila, México" or "Austin, Texas, USA"
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE';
  googleSheetsUrl?: string;
  dateCreated: string;
}

export interface Branch {
  id: string;
  agencyId: string;
  name: string;
  address?: string;
  phone?: string;
  managerId?: string;
}

export interface Sale {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  type: OperationType;
  finalPrice: number;
  commission: number;
  agencyId: string;
  branchId?: string;
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
  agencyId: string;
  branchId?: string;
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

// ============ RESOURCE LIBRARY ============

export type ResourceType = 'pdf' | 'video' | 'course' | 'link';

export enum ResourceCategory {
  CONTRACTS = 'CONTRACTS',
  MARKETING = 'MARKETING',
  REQUIREMENTS = 'REQUIREMENTS',
  INFONAVIT = 'INFONAVIT',
  SUCCESS_STORIES = 'SUCCESS_STORIES',
  TRAINING = 'TRAINING'
}

export interface LibraryResource {
  id: string;
  agencyId?: string;
  title: string;
  type: ResourceType;
  category: ResourceCategory;
  url: string;
  thumbnailUrl?: string;
  description: string;
  dateAdded: string;
}

// ============ NOTARY DIRECTORY ============

export interface Notary {
  id: string;
  agencyId: string;
  name: string;
  notaryNumber: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  coordinates?: { lat: number; lng: number };
  dateAdded: string;
}

// ============ SAAS BILLING & USAGE ============

export interface UsageLog {
  id: string;
  agencyId: string;
  userId: string;
  feature: 'AI_ASSISTANT' | 'COMPUTER_VISION' | 'AD_GENERATION' | 'VOICE_AGENT'; // Added AD_GENERATION
  tokensUsed: number;
  costEstimate: number;
  timestamp: string;
  metadata?: any;
}

export interface AgencyBilling {
  agencyId: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  currentMonthTokens: number;
  monthlyTokenLimit: number;
  creditsBalance: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  customApiKey?: string;
}
