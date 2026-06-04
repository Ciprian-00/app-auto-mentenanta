// Watermark decorativ în spatele cardurilor: siluetă line-art de mașină sport.
// SVG-ul sursă (o singură culoare) e folosit ca mască peste un strat colorat cu
// var(--accent), așa că se colorează curat în tonul temei, indiferent de culoarea
// din fișier. Raportul laturilor vine din viewBox-ul SVG-ului (4477.55 / 2039.88),
// deci e suficient să transmiți `height` în style — lățimea se calculează singură.
const SVG_URL = `${process.env.PUBLIC_URL}/car-watermark.svg`;

const CarWatermark = ({ style }) => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      aspectRatio: '4477.55 / 2039.88',
      backgroundColor: 'var(--accent)',
      WebkitMaskImage: `url(${SVG_URL})`,
      maskImage: `url(${SVG_URL})`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      pointerEvents: 'none',
      userSelect: 'none',
      ...style,
    }}
  />
);

export default CarWatermark;
