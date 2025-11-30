
import React, { useState, useRef } from 'react';
import { X, Save, UserPlus, Bed, Activity, Camera, Upload } from 'lucide-react';
import { Patient, VitalThresholds } from '../types';
import { DEFAULT_THRESHOLDS } from '../constants';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patient: Patient) => void;
}

const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    diagnosis: '',
    room: '',
    bed: '',
    riskScore: 'Low'
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random ID (Mock)
    const newId = `P-${Math.floor(1000 + Math.random() * 9000)}`;

    // Determine photo URL: Use uploaded photo OR generate random based on gender
    let finalPhotoUrl = photoPreview;
    
    if (!finalPhotoUrl) {
      finalPhotoUrl = formData.gender === 'Female' 
        ? `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300` 
        : `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300`;
    }
    
    const newPatient: Patient = {
      id: newId,
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      diagnosis: formData.diagnosis,
      room: formData.room,
      bed: formData.bed,
      admissionDate: Date.now(),
      riskScore: formData.riskScore as 'Low' | 'Medium' | 'High',
      vitals: [], // Start with empty vitals
      fluidRecords: [], // Initialize empty fluid records
      thresholds: { ...DEFAULT_THRESHOLDS }, // Use defaults
      photoUrl: finalPhotoUrl,
      medicalOrders: [] // Initialize empty medical orders
    };

    onSubmit(newPatient);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      diagnosis: '',
      room: '',
      bed: '',
      riskScore: 'Low'
    });
    setPhotoPreview(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">Yeni Hasta Kaydı</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-teal-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Photo Upload Section */}
          <div className="flex justify-center mb-6">
            <div 
              className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-teal-600">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Foto Ekle</span>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Ad Soyad</label>
              <input 
                type="text" 
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="Örn: Ayşe Demir"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Yaş</label>
                <input 
                    type="number" 
                    required
                    min="0"
                    max="120"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                />
                </div>
                <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Cinsiyet</label>
                <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                    <option value="Male">Erkek</option>
                    <option value="Female">Kadın</option>
                    <option value="Other">Diğer</option>
                </select>
                </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Tanı / Teşhis</label>
            <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="Örn: Akut Bronşit"
                    value={formData.diagnosis}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Oda No</label>
                <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                        placeholder="101"
                        value={formData.room}
                        onChange={e => setFormData({...formData, room: e.target.value})}
                    />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Yatak</label>
                <input 
                    type="text" 
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium text-center"
                    placeholder="A"
                    value={formData.bed}
                    onChange={e => setFormData({...formData, bed: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Risk Grubu</label>
                <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                    value={formData.riskScore}
                    onChange={e => setFormData({...formData, riskScore: e.target.value})}
                >
                    <option value="Low">Düşük</option>
                    <option value="Medium">Orta</option>
                    <option value="High">Yüksek</option>
                </select>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
             >
                İptal
             </button>
             <button 
                type="submit"
                className="flex-[2] py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-200 flex items-center justify-center gap-2 transition-colors"
             >
                <Save className="w-5 h-5" />
                Kaydet
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewPatientModal;
