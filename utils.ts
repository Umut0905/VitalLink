
import { VitalRecord, VitalThresholds, Patient } from './types';
import { VITAL_CHECK_INTERVALS } from './constants';

export const getVitalAlerts = (vital: VitalRecord | undefined, thresholds: VitalThresholds): string[] => {
  if (!vital) return [];
  
  const alerts: string[] = [];
  
  if (vital.systolic > thresholds.systolicHigh) alerts.push(`Yüksek Sis. Tansiyon (${vital.systolic})`);
  if (vital.systolic < thresholds.systolicLow) alerts.push(`Düşük Sis. Tansiyon (${vital.systolic})`);
  
  if (vital.diastolic > thresholds.diastolicHigh) alerts.push(`Yüksek Diy. Tansiyon (${vital.diastolic})`);
  if (vital.diastolic < thresholds.diastolicLow) alerts.push(`Düşük Diy. Tansiyon (${vital.diastolic})`);
  
  if (vital.heartRate > thresholds.heartRateHigh) alerts.push(`Yüksek Nabız (${vital.heartRate})`);
  if (vital.heartRate < thresholds.heartRateLow) alerts.push(`Düşük Nabız (${vital.heartRate})`);
  
  if (vital.temperature > thresholds.temperatureHigh) alerts.push(`Yüksek Ateş (${vital.temperature}°C)`);
  if (vital.temperature < thresholds.temperatureLow) alerts.push(`Düşük Ateş (${vital.temperature}°C)`);
  
  if (vital.spO2 < thresholds.spO2Low) alerts.push(`Düşük SpO2 (${vital.spO2}%)`);
  
  return alerts;
};

export const compressImage = (base64Str: string, maxWidth = 500, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Canvas context is not available"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => reject(error);
  });
};

// Vital Ölçüm Zamanlayıcısı Durumunu Hesapla
export const getVitalTimerStatus = (patient: Patient) => {
  const lastVital = patient.vitals[patient.vitals.length - 1];
  
  // Eğer hiç vital yoksa, hemen ölçüm gerekir
  if (!lastVital) {
    return { status: 'overdue', message: 'İlk ölçüm yapılmadı!', minutes: 0 };
  }

  const now = Date.now();
  const lastTime = lastVital.timestamp;
  // Risk skoruna göre periyot al, yoksa varsayılan Low (8 saat)
  const interval = VITAL_CHECK_INTERVALS[patient.riskScore] || VITAL_CHECK_INTERVALS['Low'];
  const nextDue = lastTime + interval;
  const diff = nextDue - now;
  const minutesRemaining = Math.floor(diff / (1000 * 60));

  if (minutesRemaining < 0) {
    return { status: 'overdue', message: `${Math.abs(minutesRemaining)} dk gecikti`, minutes: minutesRemaining };
  } else if (minutesRemaining <= 30) {
    return { status: 'warning', message: `${minutesRemaining} dk kaldı`, minutes: minutesRemaining };
  } else {
    // Saat cinsine çevirip gösterelim
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    return { status: 'ok', message: `${hours}sa ${mins}dk sonra`, minutes: minutesRemaining };
  }
};
