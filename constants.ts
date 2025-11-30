
import { Patient, VitalThresholds } from './types';

export const DEFAULT_THRESHOLDS: VitalThresholds = {
  systolicHigh: 160,
  systolicLow: 90,
  diastolicHigh: 100,
  diastolicLow: 50,
  heartRateHigh: 110,
  heartRateLow: 50,
  temperatureHigh: 38.0,
  temperatureLow: 35.5,
  spO2Low: 92,
};

// Vital Ölçüm Periyotları (Milisaniye)
// High: 2 Saat, Medium: 4 Saat, Low: 8 Saat
export const VITAL_CHECK_INTERVALS: Record<string, number> = {
  High: 2 * 60 * 60 * 1000,
  Medium: 4 * 60 * 60 * 1000,
  Low: 8 * 60 * 60 * 1000,
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1001',
    name: 'Ahmet Yılmaz',
    age: 54,
    gender: 'Male',
    diagnosis: 'Post-Op Apendektomi',
    room: '201',
    bed: 'A',
    admissionDate: Date.now() - 1000 * 60 * 60 * 48,
    riskScore: 'Low',
    thresholds: { ...DEFAULT_THRESHOLDS },
    photoUrl: 'https://images.unsplash.com/photo-1566616213894-2dcd1107d5ac?auto=format&fit=crop&q=80&w=300&h=300',
    vitals: [
      {
        id: 'v1',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
        systolic: 125,
        diastolic: 82,
        heartRate: 78,
        temperature: 36.6,
        spO2: 98,
        respiratoryRate: 16,
      },
      {
        id: 'v2',
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
        systolic: 128,
        diastolic: 85,
        heartRate: 80,
        temperature: 37.0,
        spO2: 97,
        respiratoryRate: 18,
      },
    ],
    fluidRecords: [
      {
        id: 'f1',
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        intakeMl: 250,
        outputMl: 0,
        notes: 'Oral su alımı',
      }
    ],
    anamnesis: {
      complaint: 'Sağ alt kadranda şiddetli ağrı, bulantı.',
      history: '2 gün önce başlayan karın ağrısı şikayeti ile acile başvurdu.',
      pastMedicalHistory: 'Hipertansiyon (5 yıldır)',
      familyHistory: 'Baba: MI öyküsü',
      medications: 'Delix 5mg 1x1',
      allergies: 'Penisilin',
      habits: 'Sigara (10 paket/yıl)',
      lastUpdated: Date.now() - 1000 * 60 * 60 * 48
    },
    medicalOrders: [
      {
        id: 'o1',
        medication: 'Parol',
        dosage: '500mg',
        frequency: '3x1',
        route: 'IV',
        status: 'Active',
        startDate: Date.now() - 1000 * 60 * 60 * 24,
        doctorNotes: 'Ağrı durumunda'
      },
      {
        id: 'o2',
        medication: 'Ceftriaxon',
        dosage: '1g',
        frequency: '2x1',
        route: 'IV',
        status: 'Active',
        startDate: Date.now() - 1000 * 60 * 60 * 24
      }
    ]
  },
  {
    id: 'P-1002',
    name: 'Elif Kaya',
    age: 72,
    gender: 'Female',
    diagnosis: 'Pnömoni',
    room: '202',
    bed: 'B',
    admissionDate: Date.now() - 1000 * 60 * 60 * 96,
    riskScore: 'High',
    thresholds: { 
      ...DEFAULT_THRESHOLDS,
      spO2Low: 90,
      temperatureHigh: 37.8
    },
    photoUrl: 'https://images.unsplash.com/photo-1551156327-82c99d231de3?auto=format&fit=crop&q=80&w=300&h=300',
    vitals: [
      {
        id: 'v3',
        timestamp: Date.now() - 1000 * 60 * 60 * 48,
        systolic: 145,
        diastolic: 95,
        heartRate: 92,
        temperature: 38.5,
        spO2: 92,
        respiratoryRate: 22,
      },
      {
        id: 'v4',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
        systolic: 140,
        diastolic: 90,
        heartRate: 88,
        temperature: 38.1,
        spO2: 94,
        respiratoryRate: 20,
      },
      {
        id: 'v5',
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        systolic: 135,
        diastolic: 85,
        heartRate: 84,
        temperature: 37.5,
        spO2: 96,
        respiratoryRate: 19,
      },
    ],
    fluidRecords: [],
    medicalOrders: []
  },
  {
    id: 'P-1003',
    name: 'Mehmet Demir',
    age: 45,
    gender: 'Male',
    diagnosis: 'Gözlem - Hipertansiyon',
    room: '203',
    bed: 'A',
    admissionDate: Date.now() - 1000 * 60 * 60 * 5,
    riskScore: 'Medium',
    thresholds: { ...DEFAULT_THRESHOLDS, systolicHigh: 150 },
    photoUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=300&h=300',
    vitals: [
      {
        id: 'v6',
        timestamp: Date.now() - 1000 * 60 * 60 * 4,
        systolic: 160,
        diastolic: 100,
        heartRate: 95,
        temperature: 36.5,
        spO2: 98,
        respiratoryRate: 18,
      },
    ],
    fluidRecords: [],
    medicalOrders: []
  },
];
