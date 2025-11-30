import { MedicalOrder } from '../types';

/**
 * Simulates fetching orders entered by a doctor remotely (e.g., from a hospital HBYS system).
 * In a real app, this would be a GET request to an API endpoint.
 */
export const fetchRemoteOrders = async (patientId: string): Promise<MedicalOrder[]> => {
  // Simulate network latency (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Return mock data representing remote orders
  // In a real scenario, you would filter by patientId on the backend
  const remoteOrders: MedicalOrder[] = [
    {
      id: `remote-ord-${Date.now()}-1`,
      medication: 'Pantpas',
      dosage: '40mg',
      frequency: '1x1',
      route: 'IV',
      status: 'Active',
      startDate: Date.now(),
      doctorNotes: 'Uzaktan order: Mide koruma amaçlı eklendi. (Dr. Uzman)'
    },
    {
      id: `remote-ord-${Date.now()}-2`,
      medication: 'Lasix',
      dosage: '20mg',
      frequency: '1x1',
      route: 'IV',
      status: 'Active',
      startDate: Date.now(),
      doctorNotes: 'Uzaktan order: Ödem takibi için. (Dr. Uzman)'
    }
  ];

  return remoteOrders;
};
