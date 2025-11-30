import React, { useState, useEffect } from 'react';
import { X, Save, Stethoscope, Plus, Trash2, Sparkles, Pill, Check, Calendar, AlertCircle, Filter, AlertTriangle, CloudDownload, RefreshCw } from 'lucide-react';
import { MedicalOrder } from '../types';
import { suggestMedications } from '../services/geminiService';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: MedicalOrder[];
  diagnosis: string;
  onSaveOrder: (order: MedicalOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onSyncOrders?: () => Promise<void>; // New prop for syncing
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orders, diagnosis, onSaveOrder, onDeleteOrder, onSyncOrders }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'new'>('active');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // State for sync loading
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Yeni state: Order filtreleme durumu
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Discontinued' | 'Completed'>('Active');
  
  // Doz uyarısı için state
  const [showDosageWarning, setShowDosageWarning] = useState(false);

  const [newOrder, setNewOrder] = useState<Partial<MedicalOrder>>({
    medication: '',
    dosage: '',
    frequency: '2x1',
    route: 'Oral',
    doctorNotes: '',
    startDate: Date.now()
  });

  const formatDateInput = (timestamp: number) => {
      return new Date(timestamp).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!isOpen) {
        setSuggestions([]);
        setNewOrder({ medication: '', dosage: '', frequency: '2x1', route: 'Oral', doctorNotes: '', startDate: Date.now() });
        setOrderToDelete(null);
        setStatusFilter('Active');
        setShowDosageWarning(false);
    }
  }, [isOpen]);

  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const results = await suggestMedications(diagnosis);
    setSuggestions(results);
    setIsLoadingSuggestions(false);
  };

  const handleSyncClick = async () => {
    if (onSyncOrders) {
      setIsSyncing(true);
      await onSyncOrders();
      setIsSyncing(false);
    }
  };

  const handleSuggestionClick = (medInfo: string) => {
    setNewOrder(prev => ({
        ...prev,
        medication: medInfo
    }));
  };

  const checkDosageSafety = (dosageStr: string): boolean => {
    const numericValue = parseFloat(dosageStr.replace(/[^0-9.]/g, ''));
    const isGram = dosageStr.toLowerCase().includes('g') && !dosageStr.toLowerCase().includes('mg');
    
    if (isGram && numericValue >= 2) return false;
    if (!isGram && numericValue >= 2000) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.medication) return;

    if (!showDosageWarning && newOrder.dosage && !checkDosageSafety(newOrder.dosage)) {
        setShowDosageWarning(true);
        return;
    }

    const order: MedicalOrder = {
        id: `ord-${Date.now()}`,
        medication: newOrder.medication,
        dosage: newOrder.dosage || '-',
        frequency: newOrder.frequency || '1x1',
        route: newOrder.route || 'Oral',
        status: 'Active',
        startDate: newOrder.startDate || Date.now(),
        doctorNotes: newOrder.doctorNotes
    };

    onSaveOrder(order);
    setNewOrder({ medication: '', dosage: '', frequency: '2x1', route: 'Oral', doctorNotes: '', startDate: Date.now() });
    setShowDosageWarning(false);
    setActiveTab('active');
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };

  const filteredOrders = orders.filter(order => {
      if (statusFilter === 'All') return true;
      return order.status === statusFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-200 relative">
        
        {/* Delete Confirmation Overlay */}
        {orderToDelete && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform scale-100 animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Order'ı Sil?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Bu ilacı listeden kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setOrderToDelete(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md shadow-red-200"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-violet-700 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
               <Stethoscope className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-lg font-bold leading-tight">Doktor Order Paneli</h2>
                <p className="text-xs text-violet-200 font-medium opacity-80">Tanı: {diagnosis}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSyncOrders && (
                <button
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    title="Uzaktan girilen orderları çek"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Güncelleniyor...' : 'Orderları Güncelle'}
                </button>
            )}
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-violet-100 hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
               <button
                 onClick={() => setActiveTab('active')}
                 className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'active' 
                    ? 'bg-white text-violet-700 shadow-sm border border-violet-100' 
                    : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 <span>Order Listesi</span>
                 <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs">{orders.length}</span>
               </button>
               <button
                 onClick={() => setActiveTab('new')}
                 className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'new' 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni Order Ekle</span>
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                
                {/* LIST ACTIVE ORDERS */}
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 px-2">
                                <Filter className="w-3 h-3" />
                                FİLTRE:
                            </div>
                            <select 
                                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-violet-500 focus:border-violet-500 block p-1.5 outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="Active">Aktif Orderlar</option>
                                <option value="Discontinued">Durdurulanlar</option>
                                <option value="Completed">Tamamlananlar</option>
                                <option value="All">Tümü</option>
                            </select>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <Pill className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                <p>{statusFilter === 'All' ? 'Hiç kayıtlı order yok.' : 'Bu kriterde order bulunmamaktadır.'}</p>
                                <p className="text-xs mt-2 text-gray-300">Uzaktan girilen orderları görmek için "Güncelle" butonunu kullanabilirsiniz.</p>
                            </div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-start hover:border-violet-200 transition-colors group animate-in slide-in-from-bottom-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{order.medication}</h4>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                order.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                order.status === 'Discontinued' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {order.status === 'Active' ? 'Aktif' : order.status === 'Discontinued' ? 'Durduruldu' : 'Tamamlandı'}
                                            </span>
                                            
                                            {/* Show Remote Indicator if needed (optional logic) */}
                                            {order.id.startsWith('remote-') && (
                                                <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-100 flex items-center gap-1">
                                                    <CloudDownload className="w-3 h-3" /> Remote
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <span className="text-gray-400 text-xs uppercase">Doz:</span>
                                                <span className="font-medium text-violet-700">{order.dosage}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <span className="text-gray-400 text-xs uppercase">Sıklık:</span>
                                                <span className="font-medium text-violet-700">{order.frequency}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <span className="text-gray-400 text-xs uppercase">Yol:</span>
                                                <span className="font-medium text-violet-700">{order.route}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>Başlangıç: {new Date(order.startDate).toLocaleDateString()}</span>
                                        </div>

                                        {order.doctorNotes && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800 italic flex gap-2 items-start">
                                                <span className="font-bold">Not:</span> {order.doctorNotes}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteClick(order.id)}
                                        className="text-gray-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Order'ı Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* NEW ORDER FORM */}
                {activeTab === 'new' && (
                    <div className="space-y-6">
                        {/* AI Suggestion Section */}
                        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 rounded-xl border border-violet-100">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-violet-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    AI Klinik Destek
                                </h3>
                                {!suggestions.length && !isLoadingSuggestions && (
                                    <button 
                                        onClick={handleGetSuggestions}
                                        className="text-xs bg-white text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg font-bold hover:bg-violet-50 transition-colors"
                                    >
                                        Tanıya Uygun İlaç Öner
                                    </button>
                                )}
                            </div>
                            
                            {isLoadingSuggestions && (
                                <div className="text-xs text-violet-500 flex items-center gap-2 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Analiz ediliyor...
                                </div>
                            )}

                            {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((drug, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleSuggestionClick(drug)}
                                            className="text-xs bg-white border border-violet-200 text-gray-700 hover:border-violet-500 hover:text-violet-700 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> {drug}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Doz Uyarısı Banner'ı */}
                            {showDosageWarning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-amber-800">Yüksek Doz Uyarısı</h4>
                                        <p className="text-xs text-amber-700 mt-1">
                                            Girdiğiniz doz ({newOrder.dosage}) standart aralıkların üzerinde görünüyor. Doğruluğundan emin misiniz?
                                        </p>
                                        <button 
                                            type="submit"
                                            className="mt-3 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors"
                                        >
                                            Evet, Onaylıyorum ve Kaydet
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">İlaç Adı</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium"
                                    placeholder="Örn: Augmentin, Parol..."
                                    value={newOrder.medication}
                                    onChange={e => setNewOrder({...newOrder, medication: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Başlangıç Tarihi</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                        value={formatDateInput(newOrder.startDate || Date.now())}
                                        onChange={e => setNewOrder({...newOrder, startDate: new Date(e.target.value).getTime()})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Yol</label>
                                    <select 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                                        value={newOrder.route}
                                        onChange={e => setNewOrder({...newOrder, route: e.target.value})}
                                    >
                                        <option value="Oral">Oral</option>
                                        <option value="IV">IV</option>
                                        <option value="IM">IM</option>
                                        <option value="SC">SC</option>
                                        <option value="Topikal">Topikal</option>
                                        <option value="Inhaler">İnhaler</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Doz</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                        placeholder="1000mg"
                                        value={newOrder.dosage}
                                        onChange={e => {
                                            setNewOrder({...newOrder, dosage: e.target.value});
                                            setShowDosageWarning(false); // Düzenleme yapılırsa uyarıyı gizle
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sıklık</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                        placeholder="2x1"
                                        value={newOrder.frequency}
                                        onChange={e => setNewOrder({...newOrder, frequency: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Doktor Notu</label>
                                <textarea 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none h-20 resize-none"
                                    placeholder="Özel kullanım talimatları..."
                                    value={newOrder.doctorNotes}
                                    onChange={e => setNewOrder({...newOrder, doctorNotes: e.target.value})}
                                />
                            </div>

                            {!showDosageWarning && (
                                <button 
                                    type="submit"
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Order Oluştur
                                </button>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for loader
const Loader2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default OrderModal;
