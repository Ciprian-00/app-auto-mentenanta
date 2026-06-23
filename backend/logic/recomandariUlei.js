// backend/logic/recomandariUlei.js
// Logica de recomandare pentru ulei, scoasa din controller ca sa poata fi testata.
// Aceeasi regula: avertizare la 90% din interval, urgent la depasire,
// invitatie de completare cand lipsesc datele de referinta.

function recomandariUlei(vehicul, spec, acum = new Date()) {
  const recomandari = [];
  if (!spec || !spec.ulei) return recomandari;

  const ulei = vehicul.ultimulSchimbUlei || {};
  const detalii = `Tip ulei recomandat: ${spec.ulei.tip}, Cantitate: ${spec.ulei.cantitate}L`;

  // Fara data sau kilometraj de referinta nu putem calcula nimic.
  // Il invitam sa completeze, in loc sa presupunem.
  if (!ulei.data && !(ulei.kilometraj > 0)) {
    recomandari.push({
      tip: 'Adauga ultimul schimb de ulei',
      urgent: false,
      mesaj: 'Inregistreaza data si kilometrajul ultimului schimb de ulei.',
      detalii
    });
    return recomandari;
  }

  // Recomandare dupa kilometraj
  if (ulei.kilometraj > 0) {
    const kmDeLaSchimb = vehicul.kilometrajCurent - ulei.kilometraj;
    if (kmDeLaSchimb >= spec.ulei.intervalKm * 0.9) {
      recomandari.push({
        tip: 'Schimb ulei',
        urgent: kmDeLaSchimb >= spec.ulei.intervalKm,
        mesaj: `Ai parcurs ${kmDeLaSchimb} km de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalKm} km.`,
        detalii
      });
    }
  }

  // Recomandare dupa timp
  if (ulei.data) {
    const luniDeLaSchimb = Math.floor((acum - new Date(ulei.data)) / (1000 * 60 * 60 * 24 * 30));
    if (luniDeLaSchimb >= spec.ulei.intervalLuni * 0.9) {
      recomandari.push({
        tip: 'Schimb ulei dupa timp',
        urgent: luniDeLaSchimb >= spec.ulei.intervalLuni,
        mesaj: `Au trecut ${luniDeLaSchimb} luni de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalLuni} luni.`,
        detalii
      });
    }
  }

  return recomandari;
}

module.exports = recomandariUlei;
