
import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission } from '../services/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Uygulama Ayarları
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
              Bildirim Tercihleri
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  permission === 'granted' ? 'bg-teal-100 text-teal-600' : 
                  permission === 'denied' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {permission === 'granted' ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-gray-900">Kritik Uyarılar</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      permission === 'granted' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                      permission === 'denied' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {permission === 'granted' ? 'Aktif' : permission === 'denied' ? 'Engellendi' : 'İzin Bekliyor'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Hasta vital bulguları kritik seviyeleri aştığında anlık sesli ve görsel bildirim alın.
                  </p>

                  {permission === 'default' && (
                    <button 
                      onClick={handleRequestPermission}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95"
                    >
                      Bildirimleri Etkinleştir
                    </button>
                  )}

                  {permission === 'denied' && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex gap-2 items-start text-xs text-red-700">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Bildirimlere izin verilmedi. Tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) izinleri sıfırlayarak tekrar deneyin.
                      </span>
                    </div>
                  )}

                  {permission === 'granted' && (
                    <div className="flex items-center gap-2 text-xs text-teal-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sistem şu anda kritik uyarıları iletmeye hazır.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
             <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
             <div className="text-xs text-blue-800">
               <p className="font-bold mb-1">Neden Önemli?</p>
               <p>VitalLink, arka planda çalışırken bile hastalarınızın durumu değiştiğinde sizi haberdar etmek için push bildirim teknolojisini kullanır.</p>
             </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-200 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium border border-gray-300 rounded-lg transition-colors text-sm"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
