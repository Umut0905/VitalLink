
import { GoogleGenAI } from "@google/genai";
import { Patient } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePatientVitals = async (patient: Patient): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const vitalHistory = patient.vitals.map(v => 
      `Zaman: ${new Date(v.timestamp).toLocaleString()}, Tansiyon: ${v.systolic}/${v.diastolic}, Nabız: ${v.heartRate}, Ateş: ${v.temperature}°C, SpO2: ${v.spO2}%, Solunum: ${v.respiratoryRate}`
    ).join('\n');

    const prompt = `
      Sen uzman bir kıdemli klinisyensin. Aşağıdaki hasta vital bulgu geçmişini analiz et: ${patient.name} (Yaş: ${patient.age}, Tanı: ${patient.diagnosis}).
      
      Vital Geçmişi (Eskiden Yeniye):
      ${vitalHistory}

      Lütfen kısa ve öz bir klinik değerlendirme yap (maksimum 150 kelime).
      1. Endişe verici trendleri belirle (örn. sepsis belirtileri, şok, solunum sıkıntısı).
      2. Hastanın stabilitesi hakkında yorum yap.
      3. Gerekirse acil hemşirelik müdahalelerini öner.
      
      Çıktı Formatı: Markdown. Madde işaretleri kullan. Doğrudan ve profesyonel ol. Dil: Türkçe.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Analiz Hatası:", error);
    return "AI Servisi şu anda kullanılamıyor. Lütfen API bağlantınızı kontrol edin.";
  }
};

export const suggestMedications = async (diagnosis: string): Promise<string[]> => {
  try {
     const model = 'gemini-2.5-flash';
     const prompt = `
       "${diagnosis}" tanısı konulan bir yetişkin hasta için yaygın olarak kullanılan standart ilaçları listele.
       
       Kurallar:
       1. Sadece ilaç adlarını ve standart dozaj formlarını (örn. Parol 500mg) listele.
       2. Listeyi JSON array formatında döndür: ["İlaç 1", "İlaç 2", ...].
       3. Başka hiçbir metin, açıklama veya markdown formatı ekleme. Sadece raw JSON array döndür.
       4. Maksimum 5-6 temel ilaç öner.
       5. Türkiye piyasasında bulunan ilaç isimlerini tercih et.
     `;

     const response = await ai.models.generateContent({
       model: model,
       contents: prompt,
     });

     let text = response.text || "[]";
     // Temizlik (Markdown blocklarını kaldır)
     text = text.replace(/```json/g, '').replace(/```/g, '').trim();
     
     try {
       return JSON.parse(text);
     } catch (parseError) {
       console.warn("JSON parse error for meds, falling back to split", parseError);
       return text.split(',').map(s => s.trim());
     }

  } catch (error) {
    console.error("İlaç öneri hatası:", error);
    return [];
  }
};
