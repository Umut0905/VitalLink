import React, { useState, useEffect } from 'react';
import { Patient, AppView } from './types';
import { MOCK_PATIENTS } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PatientDetail from './components/PatientDetail';
import Scanner from './components/Scanner';
import SettingsModal from './components/SettingsModal';

const LOCAL_STORAGE_KEY = 'vital-link-patients-data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Initialize patients state from LocalStorage if available, otherwise use Mocks
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Local storage data could not be parsed:", error);
    }
    return MOCK_PATIENTS;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save to LocalStorage whenever patients state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setCurrentView(AppView.PATIENT_DETAIL);
  };

  const handleScanSuccess = (id: string) => {
    // Check if patient exists
    const exists = patients.find(p => p.id === id);
    if (exists) {
      setSelectedPatientId(id);
      setCurrentView(AppView.PATIENT_DETAIL);
    } else {
      alert(`${id} kimlikli hasta bu serviste bulunamadı.`);
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {currentView !== AppView.SCANNER && (
        <Header 
          onNavigate={setCurrentView} 
          currentView={currentView}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      <main className="flex-1 relative">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            patients={patients} 
            onSelectPatient={handleSelectPatient} 
            onOpenSettings={() => setIsSettingsOpen(true)}
            onAddPatient={handleAddPatient}
          />
        )}

        {currentView === AppView.PATIENT_DETAIL && selectedPatient && (
          <PatientDetail 
            patient={selectedPatient}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            onUpdatePatient={handleUpdatePatient}
          />
        )}

        {currentView === AppView.SCANNER && (
          <Scanner 
            onScan={handleScanSuccess} 
            onClose={() => setCurrentView(AppView.DASHBOARD)}
            patients={patients}
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default App;