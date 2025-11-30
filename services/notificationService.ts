
/**
 * Servis: Push Notification (Simülasyon)
 * 
 * LIMITATION NOTE / SINIRLAMA NOTU:
 * Gerçek bir üretim ortamında, bu fonksiyon bir Backend API servisine (örn. Node.js, Python)
 * HTTP POST isteği gönderir. Backend servisi daha sonra Firebase Cloud Messaging (FCM) 
 * veya APNS gibi servisleri kullanarak sağlık personelinin mobil cihazlarına bildirim gönderir.
 * 
 * Bu uygulama istemci tabanlı (client-side) çalıştığı için, backend davranışı 
 * tarayıcının yerel "Notification API"si kullanılarak ve konsola log basılarak simüle edilmektedir.
 */

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı masaüstü bildirimlerini desteklemiyor.');
    return 'unsupported';
  }
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};

export const sendPushNotification = async (title: string, body: string) => {
  // 1. Backend isteğini simüle et (Console Log)
  console.group('%c[MOCK BACKEND] Push Notification Servisi', 'color: #ef4444; font-weight: bold; font-size: 12px;');
  console.log(`Hedef: Nöbetçi Doktorlar & Hemşireler`);
  console.log(`Başlık: ${title}`);
  console.log(`İçerik: ${body}`);
  console.log('Durum: Backend servisine iletildi (Simülasyon)');
  console.groupEnd();

  // 2. Tarayıcı bildirimi göster (Client-side Fallback)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Tarayıcı kısıtlamaları nedeniyle service worker olmadan bazen bildirimler sessiz olabilir
      new Notification(title, {
        body,
        requireInteraction: true, // Kullanıcı kapatana kadar ekranda kalsın
        tag: 'vital-alert', // Aynı tag'e sahip bildirimler üst üste binmez
        // silent: false, // Bazı tarayıcılar bunu desteklemeyebilir
        icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png' // Generic alert icon url
      });
    } catch (e) {
      console.error("Tarayıcı bildirimi oluşturulamadı:", e);
    }
  } else {
    console.warn("Bildirim izni verilmediği için görsel uyarı yapılamadı.");
  }
};
