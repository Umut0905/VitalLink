import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlertTriangle, Pill, Activity, Users, Clock } from 'lucide-react';
import { Anamnesis } from '../types';

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Anamnesis;
  onSave: (data: Anamnesis) => void;
  patientName: string;
}

const AnamnesisModal: React.FC<AnamnesisModalProps> = ({ isOpen, onClose, initialData, onSave, patientName }) => {
  const [formData, setFormData] = useState<Anamnesis>({
    complaint: '',
    history: '',
    pastMedicalHistory: '',
    familyHistory: '',
    medications: '',
    allergies: '',
    habits: '',
    systemReview: '',
    lastUpdated: Date.now()
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
        // Reset form if no data
        setFormData({
            complaint: '',
            history: '',
            pastMedicalHistory: '',
            familyHistory: '',
            medications: '',
            allergies: '',
            habits: '',
            systemReview: '',
            lastUpdated: Date.now()
        });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        ...formData,
        lastUpdated: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-indigo-700 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <div>
                <h2 className="text-lg font-bold leading-tight">Anamnez Formu</h2>
                <p className="text-xs text-indigo-200 font-medium">{patientName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-indigo-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <form id="anamnesis-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Şikayet & Hikaye */}
                <div className="space-y-4">
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            Şikayet ve Öykü
                        </label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Şikayet (Complaint)</label>
                                <textarea 
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-20"
                                    placeholder="Hastanın geliş şikayeti..."
                                    value={formData.complaint}
                                    onChange={e => setFormData({...formData, complaint: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hikaye (History)</label>
                                <textarea 
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
                                    placeholder="Şikayetin süresi, niteliği, eşlik eden belirtiler..."
                                    value={formData.history}
                                    onChange={e => setFormData({...formData, history: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Özgeçmiş & Soygeçmiş */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            Özgeçmiş
                        </label>
                        <textarea 
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            placeholder="Kronik hastalıklar, ameliyatlar..."
                            value={formData.pastMedicalHistory}
                            onChange={e => setFormData({...formData, pastMedicalHistory: e.target.value})}
                        />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            Soygeçmiş
                        </label>
                        <textarea 
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            placeholder="Ailedeki genetik hastalıklar..."
                            value={formData.familyHistory}
                            onChange={e => setFormData({...formData, familyHistory: e.target.value})}
                        />
                    </div>
                </div>

                {/* Kritik Bilgiler (Alerji/İlaç) */}
                <div className="space-y-4">
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    Alerjiler
                                </label>
                                <input 
                                    type="text"
                                    className="w-full p-3 bg-white border border-amber-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="İlaç, besin vb."
                                    value={formData.allergies}
                                    onChange={e => setFormData({...formData, allergies: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-blue-600" />
                                    Kullandığı İlaçlar
                                </label>
                                <input 
                                    type="text"
                                    className="w-full p-3 bg-white border border-blue-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Düzenli kullanılan ilaçlar..."
                                    value={formData.medications}
                                    onChange={e => setFormData({...formData, medications: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alışkanlıklar & Sistem Sorgusu */}
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Alışkanlıklar</label>
                        <input 
                            type="text"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Sigara, Alkol, Madde kullanımı..."
                            value={formData.habits}
                            onChange={e => setFormData({...formData, habits: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Sistem Sorgusu / Diğer Notlar</label>
                        <textarea 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                            placeholder="Diğer sistemlere ait bulgular..."
                            value={formData.systemReview}
                            onChange={e => setFormData({...formData, systemReview: e.target.value})}
                        />
                    </div>
                </div>

            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
            <button 
                onClick={onClose}
                type="button"
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
                Vazgeç
            </button>
            <button 
                type="submit"
                form="anamnesis-form"
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-colors"
            >
                <Save className="w-5 h-5" />
                Anamnezi Kaydet
            </button>
        </div>
      </div>
    </div>
  );
};

export default AnamnesisModal;