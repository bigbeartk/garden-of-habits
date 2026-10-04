/**
 * Bộ lọc màu cho lớp cây của hiệu ứng đặc biệt, viết bằng <filter> SVG.
 * Không dùng `filter` CSS: WebKit/Safari bỏ qua filter CSS đặt lên <g> bên trong SVG,
 * nên trên iPhone cây không hề đổi màu. Các ma trận dưới đây quy đổi đúng từ chuỗi CSS cũ.
 * `color-interpolation-filters="sRGB"` để ra màu giống filter CSS.
 */
type FilterProps = { id: string; animate: boolean };

const REGION = { x: '-25%', y: '-25%', width: '150%', height: '150%' };

/** brightness(k) của CSS = nhân tuyến tính R, G, B */
function Brightness({ k }: { k: number }) {
  return (
    <feComponentTransfer>
      <feFuncR type="linear" slope={k} />
      <feFuncG type="linear" slope={k} />
      <feFuncB type="linear" slope={k} />
    </feComponentTransfer>
  );
}

/** Vàng ròng = sepia(0.9) saturate(2.6) hue-rotate(-12deg) brightness(1.08) */
export function GoldFilter({ id }: FilterProps) {
  return (
    <filter id={id} {...REGION} colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values={'0.4537 0.6921 0.1701 0 0  0.3141 0.7174 0.1512 0 0  0.2448 0.4806 0.2179 0 0  0 0 0 1 0'}
      />
      <feColorMatrix type="saturate" values="2.6" />
      <feColorMatrix type="hueRotate" values="-12" />
      <Brightness k={1.08} />
    </filter>
  );
}

/** Pha lê = saturate(0.6) hue-rotate(180deg) brightness(1.15) opacity(0.9) */
export function CrystalFilter({ id }: FilterProps) {
  return (
    <filter id={id} {...REGION} colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0.6" />
      <feColorMatrix type="hueRotate" values="180" />
      <feComponentTransfer>
        <feFuncR type="linear" slope={1.15} />
        <feFuncG type="linear" slope={1.15} />
        <feFuncB type="linear" slope={1.15} />
        <feFuncA type="linear" slope={0.9} />
      </feComponentTransfer>
    </filter>
  );
}

/** Phát sáng = drop-shadow(0 0 6px #FFF3A0): quầng sáng vàng nhạt quanh cây */
export function GlowFilter({ id }: FilterProps) {
  return (
    <filter id={id} {...REGION} colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feFlood floodColor="#FFF3A0" />
      <feComposite in2="blur" operator="in" result="halo" />
      <feMerge>
        <feMergeNode in="halo" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** Cầu vồng = hue-rotate xoay 0→360° trong 6s + saturate(1.3); giảm chuyển động thì đứng yên */
export function RainbowFilter({ id, animate }: FilterProps) {
  return (
    <filter id={id} {...REGION} colorInterpolationFilters="sRGB">
      <feColorMatrix type="hueRotate" values="0">
        {animate && <animate attributeName="values" from="0" to="360" dur="6s" repeatCount="indefinite" />}
      </feColorMatrix>
      <feColorMatrix type="saturate" values="1.3" />
    </filter>
  );
}
