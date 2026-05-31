import { useRef, useState, useCallback } from 'react';

// Pas de decupare înainte de OCR: utilizatorul trage colțurile peste document
// ca să elimine fundalul (masă, etc.) și să-l facă să umple cadrul.
// Fără dependențe — pointer events (mouse + touch) și canvas pentru export.

const HANDLE = 26; // zona de atingere a colțului (px)

const CropImagine = ({ src, onConfirm, onCancel }) => {
  const imgRef = useRef(null);
  const boxWrapRef = useRef(null); // container la dimensiunea exactă a imaginii
  const dragRef = useRef(null);

  const [render, setRender] = useState({ w: 0, h: 0 }); // dimensiuni afișate
  const [box, setBox] = useState(null);                  // { x, y, w, h } în px afișați
  const [procesez, setProcesez] = useState(false);

  // La încărcarea imaginii: măsoară dimensiunea afișată și pune un box implicit (inset 8%)
  const handleLoad = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    setRender({ w, h });
    const ix = w * 0.08;
    const iy = h * 0.08;
    setBox({ x: ix, y: iy, w: w - ix * 2, h: h - iy * 2 });
  }, []);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const pozitie = (e) => {
    const r = boxWrapRef.current.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  };

  const startDrag = (tip) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { px, py } = pozitie(e);
    dragRef.current = { tip, px, py, box: { ...box } };
    boxWrapRef.current.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragRef.current) return;
    const { px, py } = pozitie(e);
    const d = dragRef.current;
    const dx = px - d.px;
    const dy = py - d.py;
    const b = { ...d.box };
    const min = 40; // dimensiune minimă a casetei

    if (d.tip === 'move') {
      b.x = clamp(d.box.x + dx, 0, render.w - d.box.w);
      b.y = clamp(d.box.y + dy, 0, render.h - d.box.h);
    } else {
      // Colțuri: ajustează marginile, păstrând minim și în interiorul imaginii
      let left = d.box.x;
      let top = d.box.y;
      let right = d.box.x + d.box.w;
      let bottom = d.box.y + d.box.h;

      if (d.tip.includes('w')) left = clamp(d.box.x + dx, 0, right - min);
      if (d.tip.includes('e')) right = clamp(right + dx, left + min, render.w);
      if (d.tip.includes('n')) top = clamp(d.box.y + dy, 0, bottom - min);
      if (d.tip.includes('s')) bottom = clamp(bottom + dy, top + min, render.h);

      b.x = left; b.y = top; b.w = right - left; b.h = bottom - top;
    }
    setBox(b);
  };

  const endDrag = () => { dragRef.current = null; };

  const handleConfirm = () => {
    const el = imgRef.current;
    if (!el || !box) return;
    setProcesez(true);
    // Scalează din coordonate afișate în coordonate native (rezoluție completă)
    const scale = el.naturalWidth / render.w;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(box.w * scale);
    canvas.height = Math.round(box.h * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      el,
      box.x * scale, box.y * scale, box.w * scale, box.h * scale,
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob((blob) => {
      setProcesez(false);
      if (blob) onConfirm(new File([blob], 'document.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  };

  const colt = (tip, extra) => (
    <div
      onPointerDown={startDrag(tip)}
      style={{ ...st.handle, ...extra }}
    />
  );

  return (
    <div style={st.overlay}>
      <div style={st.header}>
        <p style={st.titlu}>Încadrează documentul</p>
        <p style={st.sub}>Trage colțurile peste talon, fără fundal din jur</p>
      </div>

      <div style={st.wrap}>
        <div
          ref={boxWrapRef}
          style={st.boxWrap}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img ref={imgRef} src={src} alt="decupează" onLoad={handleLoad} style={st.img} draggable={false} />

          {box && (
            <div
              onPointerDown={startDrag('move')}
              style={{
                ...st.box,
                left: box.x, top: box.y, width: box.w, height: box.h,
              }}
            >
              {colt('nw', { top: -HANDLE / 2, left: -HANDLE / 2 })}
              {colt('ne', { top: -HANDLE / 2, right: -HANDLE / 2 })}
              {colt('sw', { bottom: -HANDLE / 2, left: -HANDLE / 2 })}
              {colt('se', { bottom: -HANDLE / 2, right: -HANDLE / 2 })}
            </div>
          )}
        </div>
      </div>

      <div style={st.actiuni}>
        <button onClick={onCancel} style={st.btnAnuleaza} disabled={procesez}>ÎNAPOI</button>
        <button onClick={handleConfirm} style={st.btnConfirma} disabled={procesez || !box}>
          {procesez ? 'SE TAIE...' : 'DECUPEAZĂ & ANALIZEAZĂ'}
        </button>
      </div>
    </div>
  );
};

const st = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 500, backgroundColor: '#0b0e14',
    display: 'flex', flexDirection: 'column',
  },
  header: { padding: '18px 20px 10px', textAlign: 'center' },
  titlu: { margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' },
  sub: { margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' },
  wrap: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', userSelect: 'none', padding: '8px', minHeight: 0,
  },
  boxWrap: {
    position: 'relative', display: 'inline-block', touchAction: 'none',
    maxWidth: '100%', maxHeight: '100%',
  },
  img: { maxWidth: '100%', maxHeight: '100%', display: 'block', pointerEvents: 'none' },
  box: {
    position: 'absolute',
    border: '2px solid #00e5ff',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
    cursor: 'move', touchAction: 'none',
  },
  handle: {
    position: 'absolute', width: HANDLE, height: HANDLE,
    borderRadius: '50%', backgroundColor: '#00e5ff',
    border: '3px solid #0b0e14', touchAction: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  actiuni: {
    display: 'flex', gap: '12px',
    padding: '14px 20px calc(18px + env(safe-area-inset-bottom))',
    borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0b0e14',
    flexShrink: 0,
  },
  btnAnuleaza: {
    flex: 1, backgroundColor: '#1c2230', border: '1px solid rgba(255,255,255,0.18)',
    color: '#e2e8f0', padding: '14px', borderRadius: '10px',
    fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer',
  },
  btnConfirma: {
    flex: 2, backgroundColor: '#00e5ff', color: '#001f24', border: 'none',
    padding: '14px', borderRadius: '10px',
    fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer',
  },
};

export default CropImagine;
