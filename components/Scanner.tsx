
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ScanLine, RefreshCw, CheckCircle2, Loader2, MonitorOff } from 'lucide-react';
import { Patient } from '../types';

interface ScannerProps {
  onScan: (patientId: string) => void;
  onClose: () => void;
  patients: Patient[];
}

type ScanStatus = 'idle' | 'scanning' | 'success';
type CameraStatus = 'initializing' | 'active' | 'error' | 'retrying' | 'permission_denied' | 'no_device';

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, patients }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (isRetry = false) => {
    if (!isRetry) setCameraStatus('initializing');
    
    // Check API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("MediaDevices API not supported or context is insecure (http vs https)");
      setCameraStatus('error');
      return;
    }

    // Pre-check for video devices to avoid "Requested device not found" errors
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        console.warn("No video input devices found via enumerateDevices.");
        setCameraStatus('no_device');
        return;
      }
    } catch (e) {
      console.warn("enumerateDevices failed or not supported, proceeding with try/catch strategy.", e);
    }

    try {
      stopCamera(); // Ensure previous stream is closed

      let stream: MediaStream | null = null;
      
      // Robust Camera Access Strategy
      try {
        // Strategy 1: Explicitly ask for environment camera (ideal for scanning)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err1) {
        console.warn("Strategy 1 (Environment) failed:", err1);
        try {
          // Strategy 2: Explicitly ask for user camera
          stream = await navigator.mediaDevices.getUserMedia({ 
             video: { facingMode: 'user' } 
          });
        } catch (err2) {
           console.warn("Strategy 2 (User) failed:", err2);
           try {
             // Strategy 3: Ask for ANY video device (no constraints)
             stream = await navigator.mediaDevices.getUserMedia({ video: true });
           } catch (err3: any) {
             console.error("Strategy 3 (Any) failed:", err3);
             
             const errorMessage = (err3?.message || err3?.toString() || '').toLowerCase();
             const errorName = err3?.name || '';

             // Critical Check: If device not found, stop retrying immediately
             if (
               errorName === 'NotFoundError' || 
               errorName === 'DevicesNotFoundError' || 
               errorMessage.includes('not found') ||
               errorMessage.includes('device not found')
             ) {
                setCameraStatus('no_device');
                return;
             }
             if (
               errorName === 'NotAllowedError' || 
               errorName === 'PermissionDeniedError' || 
               errorMessage.includes('permission') || 
               errorMessage.includes('denied')
             ) {
                setCameraStatus('permission_denied');
                return;
             }
             
             throw err3; // Propagate other errors to trigger retry logic
           }
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Wait for video metadata to ensure stream is actually ready
        videoRef.current.onloadedmetadata = () => {
             setCameraStatus('active');
             setRetryCount(0); 
        };
      }
    } catch (err: any) {
      console.error("Camera initialization fatal error:", err);
      
      // Secondary check in outer catch to catch any rethrown errors or unexpected ones
      const errorMessage = (err?.message || err?.toString() || '').toLowerCase();
      if (errorMessage.includes('not found') || errorMessage.includes('device')) {
         setCameraStatus('no_device');
         return;
      }

      if (retryCount < maxRetries) {
        setCameraStatus('retrying');
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff
        setTimeout(() => {
          startCamera(true);
        }, 1000 * nextRetry);
      } else {
        setCameraStatus('error');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimulateScan = (patientId: string) => {
    if (scanStatus !== 'idle') return;

    setScanStatus('scanning');

    setTimeout(() => {
      setScanStatus('success');
      setTimeout(() => {
        onScan(patientId);
      }, 600);
    }, 1500);
  };

  const renderErrorState = () => {
    let title = "Kamera Hatası";
    let message = "Kamera başlatılamadı.";
    let icon = <Camera className="w-10 h-10 text-red-500" />;
    let showRetry = true;

    if (cameraStatus === 'no_device') {
      title = "Kamera Bulunamadı";
      message = "Cihazınızda aktif bir kamera algılanamadı. Aşağıdaki listeden hasta seçerek manuel giriş yapabilirsiniz.";
      icon = <MonitorOff className="w-10 h-10 text-gray-500" />;
      showRetry = false; // Don't show retry if no device physically exists
    } else if (cameraStatus === 'permission_denied') {
      title = "İzin Reddedildi";
      message = "Kamera erişimine izin verilmedi. Tarayıcı ayarlarından izinleri kontrol edin.";
      icon = <X className="w-10 h-10 text-red-500" />;
      showRetry = true;
    }

    return (
      <div className="text-center p-8 max-w-xs mx-auto bg-gray-800/90 backdrop-blur-md rounded-3xl border border-gray-700 pointer-events-auto shadow-2xl animate-in fade-in zoom-in-95">
        <div className="bg-gray-700/50 p-4 rounded-full inline-block mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          {message}
        </p>
        
        {showRetry && (
          <button 
            onClick={() => { setRetryCount(0); startCamera(); }}
            className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-medium transition-colors mb-4"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </button>
        )}
        
        <div className="border-t border-gray-700 pt-4">
          <p className="text-xs text-teal-400 font-medium animate-pulse">
            Lütfen aşağıdan manuel seçim yapın &darr;
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-lg font-medium flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-teal-400" />
          Hasta QR Kodunu Tara
        </h2>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
        
        {/* Camera Feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Status Messages / Overlays */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          
          {/* Initializing / Retrying */}
          {(cameraStatus === 'initializing' || cameraStatus === 'retrying') && (
             <div className="text-center p-6 backdrop-blur-md bg-black/40 rounded-2xl animate-in zoom-in-95">
               <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-3" />
               <h3 className="text-white font-bold text-lg mb-1">Kamera Başlatılıyor...</h3>
               {cameraStatus === 'retrying' && (
                 <p className="text-teal-200 text-sm">Bağlantı sorunu, tekrar deneniyor ({retryCount}/{maxRetries})</p>
               )}
             </div>
          )}

          {/* Error States */}
          {(cameraStatus === 'error' || cameraStatus === 'permission_denied' || cameraStatus === 'no_device') && renderErrorState()}

          {/* Scanning Overlay (Only when active) */}
          {cameraStatus === 'active' && (
            <div className={`relative w-72 h-72 rounded-3xl overflow-hidden transition-all duration-300 ${
              scanStatus === 'success' ? 'border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]' :
              scanStatus === 'scanning' ? 'border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] scale-105' :
              'border-2 border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.2)]'
            }`}>
              
              {/* Corner Markers */}
              {scanStatus === 'idle' && (
                <>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl"></div>
                </>
              )}

              {/* Scanning Laser Line */}
              {scanStatus === 'idle' && (
                <div className="absolute inset-0 border-t-2 border-teal-400 animate-[scan_2.5s_infinite_linear] bg-gradient-to-b from-teal-500/20 to-transparent h-full opacity-60"></div>
              )}

              {/* Processing Pulse */}
              {scanStatus === 'scanning' && (
                 <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <div className="text-center">
                       <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-2" />
                       <span className="text-amber-400 font-bold text-lg tracking-wide shadow-black drop-shadow-md">ANALİZ EDİLİYOR...</span>
                    </div>
                 </div>
              )}

              {/* Success State */}
              {scanStatus === 'success' && (
                 <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm animate-in zoom-in duration-300">
                    <div className="text-center">
                       <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-2 drop-shadow-lg" />
                       <span className="text-white font-bold text-xl tracking-wide drop-shadow-md">BAŞARILI!</span>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
        
        {/* Helper Text */}
        {cameraStatus === 'active' && scanStatus === 'idle' && (
           <p className="absolute bottom-32 text-white/80 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm z-10 animate-in fade-in slide-in-from-bottom-4">
             QR kodu çerçevenin içine hizalayın
           </p>
        )}
      </div>

      {/* Developer / Simulation Controls */}
      <div className="bg-white p-6 rounded-t-3xl shadow-2xl pb-10 z-30">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">
          Manuel Hasta Seçimi (Simülasyon Modu)
        </p>
        <div className="grid grid-cols-1 gap-3 max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => handleSimulateScan(p.id)}
              disabled={scanStatus !== 'idle'}
              className={`flex items-center justify-between p-3 border rounded-lg transition-all group ${
                scanStatus !== 'idle' ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'bg-gray-50 hover:bg-teal-50 border-gray-200 hover:border-teal-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  scanStatus !== 'idle' ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-600 group-hover:bg-teal-200 group-hover:text-teal-700'
                }`}>
                  QR
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.id}</p>
                </div>
              </div>
              <div className={`text-xs font-medium transition-opacity ${
                 scanStatus !== 'idle' ? 'opacity-0' : 'text-teal-600 opacity-0 group-hover:opacity-100'
              }`}>
                Simüle Et &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
