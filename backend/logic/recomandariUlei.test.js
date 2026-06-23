// backend/logic/recomandariUlei.test.js
const recomandariUlei = require('./recomandariUlei');

// Specificatie reala: VW Passat, ulei 5W-30, 15.000 km / 12 luni
const spec = { ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 } };

describe('Modulul de recomandari pentru ulei', () => {

  test('ulei depasit la kilometraj -> recomandare urgenta', () => {
    const vehicul = { kilometrajCurent: 314000, ultimulSchimbUlei: { kilometraj: 298000 } };
    const rec = recomandariUlei(vehicul, spec);
    const schimb = rec.find(r => r.tip === 'Schimb ulei');
    expect(schimb).toBeDefined();
    expect(schimb.urgent).toBe(true);
  });

  test('ulei aproape de interval (peste 90%) -> recomandare normala', () => {
    const vehicul = { kilometrajCurent: 312000, ultimulSchimbUlei: { kilometraj: 298000 } };
    const rec = recomandariUlei(vehicul, spec);
    const schimb = rec.find(r => r.tip === 'Schimb ulei');
    expect(schimb).toBeDefined();
    expect(schimb.urgent).toBe(false);
  });

  test('sub pragul de avertizare -> nicio recomandare', () => {
    const vehicul = { kilometrajCurent: 308000, ultimulSchimbUlei: { kilometraj: 298000 } };
    const rec = recomandariUlei(vehicul, spec);
    expect(rec.length).toBe(0);
  });

  test('lipsesc datele ultimului schimb -> invitatie de completare', () => {
    const vehicul = { kilometrajCurent: 300000, ultimulSchimbUlei: {} };
    const rec = recomandariUlei(vehicul, spec);
    expect(rec.length).toBe(1);
    expect(rec[0].tip).toBe('Adauga ultimul schimb de ulei');
    expect(rec[0].urgent).toBe(false);
  });

  test('interval depasit dupa timp -> recomandare urgenta', () => {
    const acum = new Date('2026-06-01');
    const vehicul = { kilometrajCurent: 300000, ultimulSchimbUlei: { data: '2025-05-01' } };
    const rec = recomandariUlei(vehicul, spec, acum);
    const dupaTimp = rec.find(r => r.tip === 'Schimb ulei dupa timp');
    expect(dupaTimp).toBeDefined();
    expect(dupaTimp.urgent).toBe(true);
  });

});
