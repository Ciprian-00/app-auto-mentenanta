// Sursă unică de adevăr pentru starea unei operații cu scadență dublă (timp ȘI/SAU
// kilometraj): schimb de ulei, distribuție, lichid de frână, documente.
//
// Aplică aceeași regulă ca motorul de recomandări din backend — „oricare intervine
// primul": avertizare la 90% din interval (nivel „atenție"), depășire la 100% (nivel
// „depășit"). Astfel badge-urile din interfață nu mai contrazic recomandările.
//
// Parametri:
//   data        — data ultimei efectuări (string/Date) sau lipsă
//   plusLuni / plusAni — intervalul de timp până la următoarea scadență
//   kmInterval  — intervalul de kilometraj (opțional; lipsă = doar pe timp)
//   kmUltima    — kilometrajul la ultima efectuare
//   kmCurent    — kilometrajul curent
//   prag        — câte zile înainte de scadența pe timp se consideră „atenție"
//
// Întoarce: { nivel: 'fara'|'ok'|'atentie'|'depasit', zile, dinKm }
//   zile  — zile până la scadența pe timp (negativ = depășit pe timp)
//   dinKm — true dacă starea a fost declanșată de kilometraj, nu de timp
//           (pentru mesaje oneste: „curând" în loc de un număr de zile inexistent)

const ZI_MS = 1000 * 60 * 60 * 24;

export function evalueazaScadenta({ data, plusLuni, plusAni, kmInterval, kmUltima, kmCurent, prag }) {
  if (!data) return { nivel: 'fara', zile: null, dinKm: false };

  const urmatoare = new Date(data);
  if (plusAni) urmatoare.setFullYear(urmatoare.getFullYear() + plusAni);
  if (plusLuni) urmatoare.setMonth(urmatoare.getMonth() + plusLuni);
  const zile = Math.ceil((urmatoare - new Date()) / ZI_MS);

  // Dimensiunea pe kilometraj — doar dacă avem interval și punct de referință
  let kmNivel = null; // 'over' | 'near' | 'ok'
  if (kmInterval && kmCurent > 0 && kmUltima > 0) {
    const kmDeLa = kmCurent - kmUltima;
    kmNivel = kmDeLa >= kmInterval ? 'over' : kmDeLa >= 0.9 * kmInterval ? 'near' : 'ok';
  }

  const timpDepasit = zile < 0;
  const timpAtentie = zile >= 0 && zile <= prag;

  const nivel = (timpDepasit || kmNivel === 'over') ? 'depasit'
    : (timpAtentie || kmNivel === 'near') ? 'atentie'
      : 'ok';

  const dinKm = (kmNivel === 'over' && !timpDepasit) || (kmNivel === 'near' && !timpAtentie);

  return { nivel, zile, dinKm };
}
