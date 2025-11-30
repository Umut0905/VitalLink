
import React, { useState, useEffect, useRef } from 'react';
import { Patient, VitalRecord, VitalThresholds, FluidRecord, Anamnesis, MedicalOrder } from '../types';
import VitalChart from './VitalChart';
import { analyzePatientVitals } from '../services/geminiService';
import { sendPushNotification } from '../services/notificationService';
import { fetchRemoteOrders } from '../services/orderService';
import { getVitalAlerts, compressImage, getVitalTimerStatus } from '../utils';
import { ArrowLeft, Plus, BrainCircuit, Save, X, Thermometer, Activity, Wind, Heart, Settings, AlertOctagon, Calendar, CheckCircle2, AlertCircle, User, Camera, Droplet, GlassWater, ArrowDownCircle, ArrowUpCircle, FileText, ClipboardList, Pill, AlignLeft, ListFilter, Filter, Clock, Users, AlertTriangle, Cigarette, Stethoscope } from 'lucide-react';
import AnamnesisModal from './AnamnesisModal';
import OrderModal from './OrderModal';

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
}

// ... (MarkdownRenderer Component remains same) ...
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900 bg-cyan-50 px-1 rounded">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm text-gray-700 leading-relaxed font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={idx} className="block content-[''] my-1" />;
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="text-cyan-700 font-bold text-base mt-4 mb-2">{trimmed.substring(4)}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="text-cyan-800 font-bold text-lg mt-5 mb-3 border-b border-cyan-100 pb-1">{trimmed.substring(3)}</h3>;
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-3 ml-1">
              <span className="mt-2 w-1.5 h-1.5 bg-cyan-500 rounded-full shrink-0 shadow-sm" />
              <span className="text-gray-800">{parseBold(trimmed.substring(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{parseBold(trimmed)}</p>;
      })}
    </div>
  );
};

// ... (InfoList Component remains same) ...
const InfoList: React.FC<{ text: string | undefined, emptyText?: string, className?: string }> = ({ text, emptyText = '-', className = '' }) => {
    if (!text) return <p className={`text-gray-700 ${className}`}>{emptyText}</p>;
    
    const items = text.split('\n').filter(item => item.trim() !== '');
    
    if (items.length <= 1) return <p className={`text-gray-700 ${className}`}>{text}</p>;

    return (
        <ul className={`list-disc list-inside space-y-0.5 text-gray-700 ${className}`}>
            {items.map((item, idx) => (
                <li key={idx}>{item}</li>
            ))}
        </ul>
    );
};

const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack, onUpdatePatient }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFluidForm, setShowFluidForm] = useState(false);
  const [showAnamnesisForm, setShowAnamnesisForm] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAddedVitalId, setLastAddedVitalId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fluidFilterTime, setFluidFilterTime] = useState<'Today' | 'All'>('Today');
  const [fluidFilterType, setFluidFilterType] = useState<string>('All');
  
  const [newVital, setNewVital] = useState<Partial<VitalRecord>>({
    systolic: 120, diastolic: 80, heartRate: 75, temperature: 36.5, spO2: 98, respiratoryRate: 16, notes: ''
  });

  const [newFluid, setNewFluid] = useState<Partial<FluidRecord>>({
    intakeMl: 0, outputMl: 0, type: 'Oral', notes: ''
  });

  const [editingThresholds, setEditingThresholds] = useState<VitalThresholds>(patient.thresholds);
  
  // Timer status state
  const [timerStatus, setTimerStatus] = useState(getVitalTimerStatus(patient));

  useEffect(() => {
    setEditingThresholds(patient.thresholds);
    setTimerStatus(getVitalTimerStatus(patient));
    
    // Refresh timer status every minute
    const timer = setInterval(() => {
      setTimerStatus(getVitalTimerStatus(patient));
    }, 60000);
    return () => clearInterval(timer);
  }, [patient]);

  // ... (All Handlers remain the same: handleRunAI, handleFormSubmit, executeSaveVital, etc.) ...
  const handleRunAI = async () => {
    setIsAnalyzing(true);
    const result = await analyzePatientVitals(patient);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); setShowSaveConfirmation(true); };

  const executeSaveVital = async () => {
    const record: VitalRecord = { id: Date.now().toString(), timestamp: Date.now(), systolic: Number(newVital.systolic), diastolic: Number(newVital.diastolic), heartRate: Number(newVital.heartRate), temperature: Number(newVital.temperature), spO2: Number(newVital.spO2), respiratoryRate: Number(newVital.respiratoryRate), notes: newVital.notes };
    const alerts = getVitalAlerts(record, patient.thresholds);
    if (alerts.length > 0) { await sendPushNotification(`ACİL DURUM: ${patient.name}`, `${alerts.join(', ')}. Oda: ${patient.room}`); }
    const updatedPatient = { ...patient, vitals: [...patient.vitals, record] };
    setLastAddedVitalId(record.id);
    onUpdatePatient(updatedPatient);
    setShowSaveConfirmation(false);
    setShowAddForm(false);
    setAiAnalysis(null);
  };

  const handleSaveFluid = (e: React.FormEvent) => {
    e.preventDefault();
    const record: FluidRecord = { id: Date.now().toString(), timestamp: Date.now(), intakeMl: Number(newFluid.intakeMl) || 0, outputMl: Number(newFluid.outputMl) || 0, type: newFluid.type, notes: newFluid.notes };
    const currentFluids = patient.fluidRecords || [];
    const updatedPatient = { ...patient, fluidRecords: [record, ...currentFluids] };
    onUpdatePatient(updatedPatient);
    setShowFluidForm(false);
    setNewFluid({ intakeMl: 0, outputMl: 0, type: 'Oral', notes: '' });
  };

  const handleSaveAnamnesis = (data: Anamnesis) => { const updatedPatient = { ...patient, anamnesis: data }; onUpdatePatient(updatedPatient); setShowAnamnesisForm(false); };
  const handleSaveThresholds = (e: React.FormEvent) => { e.preventDefault(); const updatedPatient = { ...patient, thresholds: editingThresholds }; onUpdatePatient(updatedPatient); setShowThresholdForm(false); };
  
  const handlePhotoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try { const compressed = await compressImage(base64); const updatedPatient = { ...patient, photoUrl: compressed }; onUpdatePatient(updatedPatient); } 
        catch (error) { console.error("Resim sıkıştırma hatası", error); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrder = (order: MedicalOrder) => { const currentOrders = patient.medicalOrders || []; const updatedPatient = { ...patient, medicalOrders: [order, ...currentOrders] }; onUpdatePatient(updatedPatient); };
  const handleDeleteOrder = (orderId: string) => { const currentOrders = patient.medicalOrders || []; const updatedPatient = { ...patient, medicalOrders: currentOrders.filter(o => o.id !== orderId) }; onUpdatePatient(updatedPatient); };
  const handleSyncRemoteOrders = async () => { try { const remoteOrders = await fetchRemoteOrders(patient.id); const currentOrders = patient.medicalOrders || []; const currentIds = new Set(currentOrders.map(o => o.id)); const newOrders = remoteOrders.filter(ro => !currentIds.has(ro.id)); if (newOrders.length > 0) { const updatedPatient = { ...patient, medicalOrders: [...newOrders, ...currentOrders] }; onUpdatePatient(updatedPatient); } } catch (error) { console.error("Sync failed:", error); alert("Veriler çekilirken bir hata oluştu."); } };

  const lastVital = patient.vitals[patient.vitals.length - 1];
  const activeAlerts = getVitalAlerts(lastVital, patient.thresholds);
  const bpStatus = { critical: lastVital && (lastVital.systolic > patient.thresholds.systolicHigh || lastVital.systolic < patient.thresholds.systolicLow || lastVital.diastolic > patient.thresholds.diastolicHigh || lastVital.diastolic < patient.thresholds.diastolicLow) };
  const hrStatus = { critical: lastVital && (lastVital.heartRate > patient.thresholds.heartRateHigh || lastVital.heartRate < patient.thresholds.heartRateLow) };
  const tempStatus = { critical: lastVital && (lastVital.temperature > patient.thresholds.temperatureHigh || lastVital.temperature < patient.thresholds.temperatureLow) };
  const spo2Status = { critical: lastVital && (lastVital.spO2 < patient.thresholds.spO2Low) };

  const getCardStyle = (isCritical: boolean | undefined) => isCritical ? "bg-red-50 border-red-300 shadow-sm ring-1 ring-red-100 animate-[alertPulse_2s_ease-in-out_infinite]" : "bg-white border-gray-200 hover:border-teal-200 hover:shadow-md";
  const getIcon = (isCritical: boolean | undefined) => isCritical ? <AlertCircle className="absolute top-3 right-3 w-5 h-5 text-red-500 animate-pulse" /> : <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-gray-300 group-hover:text-teal-500 transition-colors" />;

  const filteredVitals = patient.vitals.filter(v => {
    const vDate = new Date(v.timestamp);
    if (startDate) { const start = new Date(startDate); start.setHours(0, 0, 0, 0); if (vDate.getTime() < start.getTime()) return false; }
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); if (vDate.getTime() > end.getTime()) return false; }
    return true;
  });
  const tableData = [...filteredVitals].reverse();

  const getFilteredFluids = () => {
    let fluids = patient.fluidRecords || [];
    if (fluidFilterTime === 'Today') { const today = new Date(); today.setHours(0,0,0,0); fluids = fluids.filter(f => f.timestamp >= today.getTime()); }
    if (fluidFilterType !== 'All') { fluids = fluids.filter(f => f.type === fluidFilterType); }
    return fluids.sort((a, b) => b.timestamp - a.timestamp);
  };
  const filteredFluidRecords = getFilteredFluids();
  const totalIntake = filteredFluidRecords.reduce((sum, f) => sum + f.intakeMl, 0);
  const totalOutput = filteredFluidRecords.reduce((sum, f) => sum + f.outputMl, 0);
  const fluidBalance = totalIntake - totalOutput;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Header Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-teal-700 font-medium transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Panele Dön</button>
      </div>

      {/* Patient Header Card with Vital Timer */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
        {activeAlerts.length > 0 && <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold text-center py-1 animate-pulse">UYARI: Hasta vital bulguları belirlenen limitlerin dışında</div>}
        
        {/* Vital Timer Warning (If Overdue) */}
        {timerStatus.status === 'overdue' && (
            <div className="absolute top-0 right-0 bg-red-100 text-red-800 text-xs font-bold px-4 py-1 rounded-bl-xl flex items-center gap-2 animate-pulse z-10">
                <Clock className="w-3 h-3" />
                <span>ÖLÇÜM GECİKTİ: {Math.abs(timerStatus.minutes)} dk</span>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center mt-2">
          <div className="flex items-center gap-4">
             <div className="relative w-20 h-20 rounded-full border-4 border-gray-50 shadow-md overflow-hidden shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Fotoğrafı Değiştir">
               {patient.photoUrl ? (<><img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div></>) : (<div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors"><User className="w-8 h-8 group-hover:hidden" /><Camera className="w-8 h-8 hidden group-hover:block text-teal-600" /></div>)}
               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpdate} />
             </div>
             <div>
                 <div className="flex items-center gap-3 mb-1">
                     <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                     <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded border border-gray-200">{patient.id}</span>
                 </div>
                 <p className="text-gray-500">{patient.diagnosis}</p>
                 
                 {/* Next Check Indicator */}
                 <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md text-xs font-bold ${
                    timerStatus.status === 'overdue' ? 'bg-red-50 text-red-600' :
                    timerStatus.status === 'warning' ? 'bg-orange-50 text-orange-600' :
                    'bg-green-50 text-green-600'
                 }`}>
                     <Clock className="w-3 h-3" />
                     <span>Sonraki Ölçüm: {timerStatus.message}</span>
                 </div>
             </div>
          </div>
          <div className="flex items-center gap-6 text-sm pl-24 md:pl-0">
            <div className="text-center"><div className="text-gray-400 text-xs uppercase tracking-wider">Oda</div><div className="font-semibold text-gray-800 text-lg">{patient.room}</div></div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center"><div className="text-gray-400 text-xs uppercase tracking-wider">Yaş</div><div className="font-semibold text-gray-800 text-lg">{patient.age}</div></div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center"><button onClick={() => setShowThresholdForm(true)} className="flex flex-col items-center group"><div className="text-gray-400 text-xs uppercase tracking-wider group-hover:text-teal-600">Limitler</div><Settings className="w-5 h-5 text-gray-600 group-hover:text-teal-600 mt-0.5" /></button></div>
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
           <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" /><div><h3 className="text-red-800 font-bold">Vital Bulgu Uyarısı</h3><div className="flex flex-wrap gap-2 mt-2">{activeAlerts.map((alert, idx) => (<span key={idx} className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200">{alert}</span>))}</div></div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <VitalChart data={patient.vitals} />
          
          {/* Anamnesis Summary */}
          {patient.anamnesis && (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                    <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-indigo-900">Hasta Anamnezi</h3></div>
                    <button onClick={() => setShowAnamnesisForm(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline">Düzenle</button>
                </div>
                <div className="p-5 text-sm space-y-4">
                    <div className="bg-indigo-50/30 p-3 rounded-lg border border-indigo-50"><span className="block text-xs font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Şikayet & Hikaye</span><p className="text-gray-800 font-medium mb-2">{patient.anamnesis.complaint || '-'}</p><p className="text-gray-600 text-xs italic">{patient.anamnesis.history || 'Hikaye detayı girilmemiş.'}</p></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Özgeçmiş</span><p className="text-gray-700">{patient.anamnesis.pastMedicalHistory || 'Özellik yok'}</p></div><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Soygeçmiş</span><p className="text-gray-700">{patient.anamnesis.familyHistory || 'Özellik yok'}</p></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4"><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Pill className="w-3 h-3" /> İlaçlar</span><InfoList text={patient.anamnesis.medications} emptyText="Kullanmıyor" /></div><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Alerjiler</span><InfoList text={patient.anamnesis.allergies} emptyText="Bilinen yok" className="text-red-600 font-bold" /></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4"><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Cigarette className="w-3 h-3" /> Alışkanlıklar</span><p className="text-gray-700">{patient.anamnesis.habits || '-'}</p></div><div><span className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Sistem Sorgusu</span><p className="text-gray-700 text-xs">{patient.anamnesis.systemReview || '-'}</p></div></div>
                </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-white rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-cyan-50 border-b border-cyan-100 flex justify-between items-center">
              <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-cyan-600" /><h3 className="font-semibold text-cyan-900">Yapay Zeka Asistanı</h3></div>
              <button onClick={handleRunAI} disabled={isAnalyzing} className="text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors shadow-sm">{isAnalyzing ? 'Analiz ediliyor...' : 'Analiz Et'}</button>
            </div>
            <div className="p-5">{aiAnalysis ? <MarkdownRenderer content={aiAnalysis} /> : <div className="text-center py-6 text-gray-400 text-sm">Güncel trendlerin değerlendirmesi için "Analiz Et" butonuna tıklayın.</div>}</div>
          </div>
          
          {/* Fluid Balance */}
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
             {/* ... (Fluid Balance content remains same) ... */}
             <div className="p-3 bg-blue-50/50 border-b border-blue-100"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div className="flex items-center gap-2"><Droplet className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-blue-900">Sıvı Dengesi</h3></div><div className="flex items-center gap-2 w-full sm:w-auto"><select className="text-xs bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-blue-400 font-medium shadow-sm" value={fluidFilterTime} onChange={(e) => setFluidFilterTime(e.target.value as 'Today' | 'All')}><option value="Today">Bugün (24 Saat)</option><option value="All">Tüm Zamanlar</option></select><div className="h-4 w-px bg-blue-200"></div><select className="text-xs bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-blue-400 font-medium shadow-sm max-w-[100px]" value={fluidFilterType} onChange={(e) => setFluidFilterType(e.target.value)}><option value="All">Tüm Tipler</option><option value="Oral">Oral</option><option value="IV">IV</option><option value="TPN">TPN</option><option value="NG">NG</option><option value="İdrar">İdrar</option><option value="Dren">Dren</option><option value="Kusma">Kusma</option></select></div></div></div><div className="p-5"><div className="grid grid-cols-3 gap-4 mb-4"><div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100"><span className="text-xs text-blue-500 font-bold uppercase block mb-1">Giriş</span><span className="text-xl font-bold text-blue-700">{totalIntake} ml</span></div><div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100"><span className="text-xs text-amber-500 font-bold uppercase block mb-1">Çıkış</span><span className="text-xl font-bold text-amber-700">{totalOutput} ml</span></div><div className={`p-3 rounded-lg text-center border ${fluidBalance > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}><span className={`text-xs font-bold uppercase block mb-1 ${fluidBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>Denge</span><span className={`text-xl font-bold ${fluidBalance > 0 ? 'text-green-700' : 'text-red-700'}`}>{fluidBalance > 0 ? '+' : ''}{fluidBalance} ml</span></div></div><div className="mt-4"><div className="flex items-center gap-2 mb-2"><Filter className="w-3 h-3 text-gray-400" /><h4 className="text-xs font-bold text-gray-500 uppercase">{fluidFilterTime === 'Today' ? 'Bugünkü Kayıtlar' : 'Geçmiş Kayıtlar'} ({filteredFluidRecords.length})</h4></div>{filteredFluidRecords.length > 0 ? (<div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">{filteredFluidRecords.map(rec => (<div key={rec.id} className="bg-gray-50/50 p-2 rounded-lg border border-gray-100 hover:bg-white hover:border-blue-100 transition-colors group"><div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">{rec.type || 'Belirsiz'}</span><span className="text-xs text-gray-400">{new Date(rec.timestamp).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span></div><div className="font-bold text-sm">{rec.intakeMl > 0 ? (<span className="text-blue-600">+{rec.intakeMl} ml</span>) : (<span className="text-amber-600">-{rec.outputMl} ml</span>)}</div></div>{rec.notes && (<p className="text-xs text-gray-500 italic pl-1 border-l-2 border-gray-200 group-hover:border-blue-200">{rec.notes}</p>)}</div>))}</div>) : (<div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">Seçilen kriterlere uygun kayıt bulunamadı.</div>)}</div></div>
          </div>

          {/* Vitals History Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
             {/* ... (Vitals Table content remains same) ... */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"><h3 className="font-semibold text-gray-800">Geçmiş Kayıtlar</h3><div className="flex flex-wrap items-center gap-2 text-sm w-full sm:w-auto"><div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto"><Calendar className="w-4 h-4 text-gray-400 ml-1" /><input type="date" className="bg-transparent border-none text-gray-700 focus:ring-0 text-xs sm:text-sm p-0 w-28 sm:w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><span className="text-gray-400">-</span><input type="date" className="bg-transparent border-none text-gray-700 focus:ring-0 text-xs sm:text-sm p-0 w-28 sm:w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>{(startDate || endDate) && (<button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1">Temizle</button>)}</div></div><div className="overflow-x-auto custom-scrollbar"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-3 py-2">Zaman</th><th className="px-3 py-2">Tansiyon</th><th className="px-3 py-2">Nabız</th><th className="px-3 py-2">Ateş</th><th className="px-3 py-2">SpO2</th><th className="px-3 py-2">Not</th></tr></thead><tbody className="divide-y divide-gray-100">{tableData.length > 0 ? (tableData.map(v => (<tr key={v.id} className={`hover:bg-teal-50/30 transition-colors ${v.id === lastAddedVitalId ? 'animate-[highlightFade_2s_ease-out]' : ''}`}><td className="px-3 py-2 whitespace-nowrap font-bold text-gray-900">{new Date(v.timestamp).toLocaleString()}</td><td className="px-3 py-2 font-bold text-black">{v.systolic}/{v.diastolic}</td><td className="px-3 py-2 font-bold text-black">{v.heartRate}</td><td className="px-3 py-2 font-bold text-black">{v.temperature}</td><td className="px-3 py-2 font-bold text-black">{v.spO2}%</td><td className="px-3 py-2 text-black font-medium truncate max-w-[150px]">{v.notes || '-'}</td></tr>))) : (<tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Seçilen tarih aralığında veri bulunamadı.</td></tr>)}</tbody></table></div>
          </div>
        </div>

        {/* Right Col: Stats & Actions */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             {/* ... Vital Cards (No Change) ... */}
             <div className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center py-6 ${getCardStyle(bpStatus.critical)}`}>{getIcon(bpStatus.critical)}<Activity className={`w-8 h-8 mb-3 transition-colors duration-300 ${bpStatus.critical ? 'text-red-600' : 'text-gray-300 group-hover:text-teal-500'}`} /><span className={`text-2xl font-bold transition-colors ${bpStatus.critical ? 'text-red-700' : 'text-gray-800 group-hover:text-gray-900'}`}>{lastVital?.systolic}/{lastVital?.diastolic}</span><span className={`text-xs uppercase transition-colors ${bpStatus.critical ? 'text-red-500' : 'text-gray-400 group-hover:text-teal-600'}`}>Tansiyon</span></div>
             <div className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center py-6 ${getCardStyle(hrStatus.critical)}`}>{getIcon(hrStatus.critical)}<Heart className={`w-8 h-8 mb-3 transition-colors duration-300 ${hrStatus.critical ? 'text-red-600' : 'text-gray-300 group-hover:text-rose-500'}`} /><span className={`text-2xl font-bold transition-colors ${hrStatus.critical ? 'text-red-700' : 'text-gray-800 group-hover:text-gray-900'}`}>{lastVital?.heartRate}</span><span className={`text-xs uppercase transition-colors ${hrStatus.critical ? 'text-red-500' : 'text-gray-400 group-hover:text-rose-600'}`}>Nabız</span></div>
             <div className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center py-6 ${getCardStyle(tempStatus.critical)}`}>{getIcon(tempStatus.critical)}<Thermometer className={`w-8 h-8 mb-3 transition-colors duration-300 ${tempStatus.critical ? 'text-red-600' : 'text-gray-300 group-hover:text-amber-500'}`} /><span className={`text-2xl font-bold transition-colors ${tempStatus.critical ? 'text-red-700' : 'text-gray-800 group-hover:text-gray-900'}`}>{lastVital?.temperature}°</span><span className={`text-xs uppercase transition-colors ${tempStatus.critical ? 'text-red-500' : 'text-gray-400 group-hover:text-amber-600'}`}>Ateş</span></div>
             <div className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center py-6 ${getCardStyle(spo2Status.critical)}`}>{getIcon(spo2Status.critical)}<Wind className={`w-8 h-8 mb-3 transition-colors duration-300 ${spo2Status.critical ? 'text-red-600' : 'text-gray-300 group-hover:text-sky-500'}`} /><span className={`text-2xl font-bold transition-colors ${spo2Status.critical ? 'text-red-700' : 'text-gray-800 group-hover:text-gray-900'}`}>{lastVital?.spO2}%</span><span className={`text-xs uppercase transition-colors ${spo2Status.critical ? 'text-red-500' : 'text-gray-400 group-hover:text-sky-600'}`}>SpO2</span></div>
          </div>
          
          <div className="space-y-3">
             <button onClick={() => setShowAddForm(true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-2"><Plus className="w-6 h-6" /> Vital Veri Ekle</button>
             <button onClick={() => setShowFluidForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"><Droplet className="w-6 h-6" /> Aldığı-Çıkardığı Takibi</button>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAnamnesisForm(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"><ClipboardList className="w-6 h-6" /> Anamnez</button>
                <button onClick={() => setShowOrderModal(true)} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center justify-center gap-2"><Stethoscope className="w-6 h-6" /> Doktor Order</button>
             </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-gray-900">Vital Veri Kaydı</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">Sistolik</label><input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xl font-mono font-bold text-black focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" value={newVital.systolic} onChange={e => setNewVital({...newVital, systolic: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">Diyastolik</label><input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xl font-mono font-bold text-black focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" value={newVital.diastolic} onChange={e => setNewVital({...newVital, diastolic: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">Nabız</label><input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-mono font-bold text-black focus:ring-2 focus:ring-teal-500 outline-none" value={newVital.heartRate} onChange={e => setNewVital({...newVital, heartRate: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">Ateş</label><input type="number" step="0.1" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-mono font-bold text-black focus:ring-2 focus:ring-teal-500 outline-none" value={newVital.temperature} onChange={e => setNewVital({...newVital, temperature: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">SpO2</label><input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-mono font-bold text-black focus:ring-2 focus:ring-teal-500 outline-none" value={newVital.spO2} onChange={e => setNewVital({...newVital, spO2: Number(e.target.value)})} /></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-black uppercase">Notlar</label><textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-base font-medium text-black focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none" value={newVital.notes} onChange={e => setNewVital({...newVital, notes: e.target.value})} /></div>
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> İlerle</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Fluid Tracking Modal */}
      {showFluidForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                 <Droplet className="w-6 h-6 text-blue-600" />
                 <h2 className="text-lg font-bold text-gray-900">Aldığı-Çıkardığı Takibi</h2>
              </div>
              <button onClick={() => setShowFluidForm(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveFluid} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start mb-2">
                 <GlassWater className="w-6 h-6 text-blue-500 mt-1" />
                 <p className="text-sm text-blue-800">Lütfen sadece gerçekleşen miktarları girin.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase"><ArrowDownCircle className="w-4 h-4 text-blue-600" /> Giriş (Intake)</label>
                  <div className="relative">
                     <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" min="0" value={newFluid.intakeMl || ''} onChange={e => setNewFluid({...newFluid, intakeMl: Number(e.target.value)})} />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ml</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase"><ArrowUpCircle className="w-4 h-4 text-amber-600" /> Çıkış (Output)</label>
                  <div className="relative">
                     <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-mono font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0" min="0" value={newFluid.outputMl || ''} onChange={e => setNewFluid({...newFluid, outputMl: Number(e.target.value)})} />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ml</span>
                  </div>
                </div>
              </div>

              {/* Improved Fluid Type and Notes */}
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-black uppercase">
                       <ListFilter className="w-3 h-3" />
                       Sıvı Tipi / Yolu
                    </label>
                    <div className="relative">
                       <select 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                          value={newFluid.type}
                          onChange={e => setNewFluid({...newFluid, type: e.target.value})}
                       >
                          <optgroup label="Giriş (Intake)">
                             <option value="Oral">Oral (Ağızdan)</option>
                             <option value="IV">IV (Damar Yolu)</option>
                             <option value="TPN">TPN</option>
                             <option value="NG">Nazogastrik</option>
                          </optgroup>
                          <optgroup label="Çıkış (Output)">
                             <option value="İdrar">İdrar</option>
                             <option value="Dren">Dren</option>
                             <option value="Kusma">Kusma</option>
                             <option value="Dışkı">Dışkı</option>
                             <option value="Kanama">Kanama</option>
                          </optgroup>
                       </select>
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-black uppercase">
                       <AlignLeft className="w-3 h-3" />
                       Notlar
                    </label>
                    <textarea 
                      className="w-full p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl text-base font-medium text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none h-28 resize-none shadow-sm transition-all"
                      placeholder="Ekstra detaylar, sıvının rengi, kokusu vb."
                      value={newFluid.notes}
                      onChange={e => setNewFluid({...newFluid, notes: e.target.value})}
                    />
                 </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSaveConfirmation && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Veri Girişini Onayla</h3>
                  <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg text-sm border border-gray-100">
                      <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Tansiyon:</span><span className="font-bold text-gray-900">{newVital.systolic}/{newVital.diastolic} mmHg</span></div>
                      <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Nabız:</span><span className="font-bold text-gray-900">{newVital.heartRate} BPM</span></div>
                       <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Ateş:</span><span className="font-bold text-gray-900">{newVital.temperature} °C</span></div>
                       <div className="flex justify-between"><span className="text-gray-500">SpO2:</span><span className="font-bold text-gray-900">%{newVital.spO2}</span></div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowSaveConfirmation(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Düzenle</button>
                      <button onClick={executeSaveVital} className="flex-1 px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-md shadow-teal-200">Onayla</button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Thresholds Modal */}
      {showThresholdForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[scaleUp_0.2s_ease-out]">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2"><Settings className="w-5 h-5" /><h2 className="text-lg font-bold">Özel Uyarı Limitleri</h2></div>
              <button onClick={() => setShowThresholdForm(false)} className="text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveThresholds} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Sistolik Alt/Üst</label><div className="flex gap-2"><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.systolicLow} onChange={e => setEditingThresholds({...editingThresholds, systolicLow: +e.target.value})} /><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.systolicHigh} onChange={e => setEditingThresholds({...editingThresholds, systolicHigh: +e.target.value})} /></div></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Diyastolik Alt/Üst</label><div className="flex gap-2"><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.diastolicLow} onChange={e => setEditingThresholds({...editingThresholds, diastolicLow: +e.target.value})} /><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.diastolicHigh} onChange={e => setEditingThresholds({...editingThresholds, diastolicHigh: +e.target.value})} /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nabız Alt/Üst</label><div className="flex gap-2"><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.heartRateLow} onChange={e => setEditingThresholds({...editingThresholds, heartRateLow: +e.target.value})} /><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.heartRateHigh} onChange={e => setEditingThresholds({...editingThresholds, heartRateHigh: +e.target.value})} /></div></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Ateş Alt/Üst</label><div className="flex gap-2"><input type="number" step="0.1" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.temperatureLow} onChange={e => setEditingThresholds({...editingThresholds, temperatureLow: +e.target.value})} /><input type="number" step="0.1" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.temperatureHigh} onChange={e => setEditingThresholds({...editingThresholds, temperatureHigh: +e.target.value})} /></div></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Min SpO2 (%)</label><input type="number" className="w-full p-2 border border-gray-300 rounded focus:border-teal-500 outline-none" value={editingThresholds.spO2Low} onChange={e => setEditingThresholds({...editingThresholds, spO2Low: +e.target.value})} /></div>
              <div className="pt-2"><button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors">Limitleri Kaydet</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Anamnesis Modal */}
      <AnamnesisModal isOpen={showAnamnesisForm} onClose={() => setShowAnamnesisForm(false)} initialData={patient.anamnesis} onSave={handleSaveAnamnesis} patientName={patient.name} />

      {/* Medical Order Modal */}
      <OrderModal 
        isOpen={showOrderModal} 
        onClose={() => setShowOrderModal(false)} 
        orders={patient.medicalOrders || []}
        diagnosis={patient.diagnosis}
        onSaveOrder={handleSaveOrder}
        onDeleteOrder={handleDeleteOrder}
        onSyncOrders={handleSyncRemoteOrders}
      />

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes alertPulse { 0%, 100% { border-color: #fca5a5; background-color: #fef2f2; box-shadow: 0 1px 2px 0 rgba(239, 68, 68, 0.05); } 50% { border-color: #ef4444; background-color: #fee2e2; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2); } }
        @keyframes highlightFade { 0% { background-color: #5eead4; } 100% { background-color: transparent; } }
      `}</style>
    </div>
  );
};

export default PatientDetail;
