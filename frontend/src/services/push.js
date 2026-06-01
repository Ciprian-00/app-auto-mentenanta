import api from './api';

// Verifică dacă browserul/dispozitivul suportă notificări push
export const pushSuportat = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Cheia VAPID vine în base64url și trebuie convertită în Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};

// Cere permisiune, se abonează la push și trimite abonamentul la server
export const aboneazaPush = async () => {
  if (!pushSuportat()) throw new Error('Notificările push nu sunt suportate pe acest dispozitiv.');

  const permisiune = await Notification.requestPermission();
  if (permisiune !== 'granted') throw new Error('Permisiunea pentru notificări a fost refuzată.');

  const reg = await navigator.serviceWorker.ready;
  const { data } = await api.get('/push/vapid');
  if (!data.key) throw new Error('Cheia de notificări lipsește pe server.');

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.key),
    });
  }
  await api.post('/push/subscribe', sub.toJSON());
};

// Dezabonează dispozitivul curent și anunță serverul
export const dezaboneazaPush = async () => {
  let endpoint;
  if (pushSuportat()) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      endpoint = sub.endpoint;
      await sub.unsubscribe();
    }
  }
  await api.post('/push/unsubscribe', { endpoint });
};

export const testPush = () => api.post('/push/test');

// TEMPORAR (demo licență): verifică imediat expirările și trimite notificările
export const verificaAcum = () => api.post('/push/verifica-acum');
