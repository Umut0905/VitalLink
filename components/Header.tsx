
import React from 'react';
import { Activity, QrCode, Settings } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, onOpenSettings }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(AppView.DASHBOARD)}
        >
          <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Vital<span className="text-teal-600">Link</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {currentView !== AppView.SCANNER && (
            <button
              onClick={() => onNavigate(AppView.SCANNER)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-teal-800 text-white px-4 py-2 rounded-full font-medium transition-all shadow-md active:scale-95 border border-transparent hover:border-teal-500/30"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Tara</span>
              <span className="sm:hidden">Tara</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
            title="Ayarlar & Bildirimler"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
