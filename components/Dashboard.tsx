
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { Search, Users, AlertTriangle, HeartPulse, BellRing, Bell, UserPlus, User, Maximize2, X, CheckCircle2, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getVitalAlerts, getVitalTimerStatus } from '../utils';
import { getNotificationPermission } from '../services/notificationService';
import NewPatientModal from './NewPatientModal';

interface DashboardProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onOpenSettings?: () => void;
  onAddPatient?: (patient: Patient) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, onSelectPatient, onOpenSettings, onAddPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Timer'ları her dakika güncellemek için basit bir tick state'i
  const [, setTick] = useState(0);

  useEffect(() => {
    const permission = getNotificationPermission();
    if (permission === 'default' || permission === 'denied') {
      setShowNotificationBanner(true);
    }

    // Dakikada bir dashboard'u yenile ki "gecikti" durumları güncellensin
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLabel = (risk: string) => {
    switch(risk) {
      case 'High': return 'Yüksek';
      case 'Medium': return 'Orta';
      case 'Low': return 'Düşük';
      default: return risk;
    }
  };

  const handleAddPatientSubmit = (newPatient: Patient) => {
    if (onAddPatient) {
      onAddPatient(newPatient);
      setSearchTerm('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification Warning Banner */}
      {showNotificationBanner && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start sm:items-center justify-between gap-4 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5 sm:mt-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Bildirimler Devre Dışı</h3>
              <p className="text-xs text-amber-800 mt-1">
                Kritik hasta uyarılarını anlık alabilmek için bildirimlere izin vermeniz önerilir.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
             <button 
               onClick={() => {
                 onOpenSettings?.();
               }}
               className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg transition-colors"
             >
               Ayarları Aç
             </button>
             <button 
               onClick={() => setShowNotificationBanner(false)}
               className="text-xs font-medium text-amber-600 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors"
             >
               Kapat
             </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Toplam Hasta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Kritik Risk</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {patients.filter(p => p.riskScore === 'High').length}
          </p>
        </div>

        {/* Placeholder stats */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Stabil</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
             {patients.filter(p => p.riskScore === 'Low').length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Servis Hastaları</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="İsim, ID veya oda no ile ara..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAddPatientOpen(true)}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm active:scale-95 whitespace-nowrap"
            >
                <UserPlus className="w-4 h-4" />
                Hasta Ekle
            </button>
        </div>
      </div>

      {/* Patient Grid or Empty State */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => {
            const lastVital = patient.vitals[patient.vitals.length - 1];
            const activeAlerts = getVitalAlerts(lastVital, patient.thresholds);
            const hasAlerts = activeAlerts.length > 0;
            const timerStatus = getVitalTimerStatus(patient);

            return (
              <div 
                key={patient.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group animate-[zoomIn_0.5s_ease-out_both] ${
                    hasAlerts || timerStatus.status === 'overdue' 
                    ? 'border-red-300 ring-1 ring-red-200' 
                    : 'border-gray-200'
                }`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      {/* Patient Photo Thumbnail */}
                      <div 
                        className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0 cursor-zoom-in group/photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (patient.photoUrl) setExpandedPhoto(patient.photoUrl);
                        }}
                      >
                        {patient.photoUrl ? (
                          <>
                            <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors cursor-pointer" onClick={() => onSelectPatient(patient.id)}>
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {patient.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        patient.riskScore === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                        patient.riskScore === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {getRiskLabel(patient.riskScore)} Risk
                      </span>
                      {hasAlerts && (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 animate-pulse">
                          <BellRing className="w-3 h-3" />
                          {activeAlerts.length} Uyarı
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${
                            timerStatus.status === 'overdue' ? 'text-red-500' : 
                            timerStatus.status === 'warning' ? 'text-orange-500' : 'text-gray-400'
                        }`} />
                        <span className="text-xs font-bold text-gray-500 uppercase">Sonraki Ölçüm:</span>
                     </div>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        timerStatus.status === 'overdue' ? 'bg-red-100 text-red-700 animate-pulse' :
                        timerStatus.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                        'text-gray-700'
                     }`}>
                        {timerStatus.message}
                     </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
                    <div className="text-gray-500">Oda</div>
                    <div className="font-medium text-gray-800 text-right">{patient.room} - {patient.bed}</div>
                    
                    <div className="text-gray-500">Yaş/Cinsiyet</div>
                    <div className="font-medium text-gray-800 text-right">{patient.age} / {patient.gender === 'Male' ? 'E' : patient.gender === 'Female' ? 'K' : 'D'}</div>
                    
                    <div className="text-gray-500">Son Kayıt</div>
                    <div className="font-medium text-gray-800 text-right">
                      {lastVital
                        ? new Date(lastVital.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : '--:--'
                      }
                    </div>
                  </div>

                  {hasAlerts && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1">Dikkat Gerekiyor:</p>
                      <ul className="text-xs text-red-700 list-disc list-inside">
                        {activeAlerts.slice(0, 2).map((alert, i) => (
                          <li key={i}>{alert}</li>
                        ))}
                        {activeAlerts.length > 2 && <li>+ {activeAlerts.length - 2} daha</li>}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSelectPatient(patient.id)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Verileri Gör
                    </button>
                    <button
                      onClick={() => setShowQR(patient.id)}
                      className="w-12 flex items-center justify-center bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200 rounded-lg transition-colors"
                      title="QR Kodu Göster"
                    >
                      <QRCode value={patient.id} size={20} style={{ display: 'none' }} />
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Users className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'Sonuç Bulunamadı' : 'Henüz Hasta Kaydı Yok'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {searchTerm ? `"${searchTerm}" aramasıyla eşleşen hasta bulunamadı.` : 'Sisteme yeni hasta ekleyerek takibe başlayabilirsiniz.'}
          </p>
          <button 
            onClick={() => setIsAddPatientOpen(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Yeni Hasta Ekle
          </button>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[slideIn_0.3s_ease-out] z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Yeni hasta başarıyla eklendi</span>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowQR(null)}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {patients.find(p => p.id === showQR)?.name}
            </h3>
            <p className="text-gray-500 text-sm mb-6">{showQR}</p>
            
            <div className="bg-white p-4 border border-gray-200 rounded-xl inline-block mb-6 shadow-inner">
              <QRCode 
                value={showQR}
                size={200}
                level="H"
                fgColor="#0f766e" // teal-700
              />
            </div>
            
            <button 
              onClick={() => setShowQR(null)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium"
            >
              Kapat
            </button>
            <p className="mt-4 text-xs text-gray-400">Bu kodu yazdırın ve hasta yatağına iliştirin.</p>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setExpandedPhoto(null)}>
           <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
              <button 
                onClick={() => setExpandedPhoto(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={expandedPhoto} 
                alt="Hasta Fotoğrafı" 
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border-4 border-white object-contain animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()} 
              />
           </div>
        </div>
      )}

      {/* New Patient Modal */}
      <NewPatientModal 
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSubmit={handleAddPatientSubmit}
      />

      <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
