
export interface VitalRecord {
  id: string;
  timestamp: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  spO2: number;
  respiratoryRate: number;
  notes?: string;
}

export interface FluidRecord {
  id: string;
  timestamp: number;
  intakeMl: number;
  outputMl: number;
  type?: string; // e.g., 'Oral', 'IV', 'Urine'
  notes?: string;
}

export interface Anamnesis {
  complaint: string;
  history: string;
  pastMedicalHistory: string;
  familyHistory: string;
  medications: string;
  allergies: string;
  habits: string;
  systemReview?: string;
  lastUpdated: number;
}

// Yeni Order (İlaç İstem) Arayüzü
export interface MedicalOrder {
  id: string;
  medication: string; // İlaç Adı
  dosage: string;     // Doz (örn. 500mg)
  frequency: string;  // Sıklık (örn. 2x1)
  route: string;      // Yol (IV, Oral, IM)
  status: 'Active' | 'Discontinued' | 'Completed';
  startDate: number;
  doctorNotes?: string;
}

export interface VitalThresholds {
  systolicHigh: number;
  systolicLow: number;
  diastolicHigh: number;
  diastolicLow: number;
  heartRateHigh: number;
  heartRateLow: number;
  temperatureHigh: number;
  temperatureLow: number;
  spO2Low: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  room: string;
  bed: string;
  admissionDate: number;
  vitals: VitalRecord[];
  fluidRecords: FluidRecord[];
  anamnesis?: Anamnesis;
  medicalOrders: MedicalOrder[]; // Yeni order listesi
  riskScore: 'Low' | 'Medium' | 'High';
  thresholds: VitalThresholds;
  photoUrl?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  PATIENT_DETAIL = 'PATIENT_DETAIL',
}
