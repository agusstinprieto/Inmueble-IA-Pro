
export enum PartCategory {
  MOTORES = 'MOTORES',
  TRANSMISIONES = 'TRANSMISIONES',
  PUERTAS = 'PUERTAS',
  ECM = 'ECM',
  BCM = 'BCM',
  SUSPENSION = 'SUSPENSION',
  DIFERENCIALES = 'DIFERENCIALES',
  LUCES = 'LUCES',
  REFRIGERACION = 'REFRIGERACION',
  ELECTRICO = 'ELECTRICO',
  AIRBAGS = 'AIRBAGS',
  INTERIORES = 'INTERIORES',
  FRENOS = 'FRENOS',
  RINES = 'RINES',
  CRISTALES = 'CRISTALES',
  CARROCERIA = 'CARROCERIA',
  DIRECCION = 'DIRECCION',
  OTROS = 'OTROS'
}

export enum PartStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD'
}

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
    trim: string;
    vin?: string;
  };
  condition: string;
  suggestedPrice: number;
  minPrice: number;
  finalPrice?: number;
  status: PartStatus;
  dateAdded: string;
  imageUrl?: string;
}

export interface AnalysisGroup {
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim: string;
    vin?: string;
  };
  parts: {
    name: string;
    category: PartCategory;
    condition: string;
    suggestedPrice: number;
    minPrice: number;
  }[];
}

export interface AnalysisResult {
  groups: AnalysisGroup[];
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  items: {
    qty: number;
    description: string;
    unitPrice: number;
    total: number;
  }[];
}
