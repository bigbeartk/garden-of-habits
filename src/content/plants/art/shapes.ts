/**
 * Đường hình bầu dục xoay `rot` độ dưới dạng path (lệnh cung A), không dùng `transform`: hộp bao của phần tử
 * vẫn thẳng trục nên gradient đất sét luôn sáng ở trên-trái, cả khi cánh hoa xoay đủ hướng.
 */
export function ellipsePath(cx: number, cy: number, rx: number, ry: number, rot: number): string {
  const a = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return `M${cx - dx} ${cy - dy} A${rx} ${ry} ${rot} 1 0 ${cx + dx} ${cy + dy} A${rx} ${ry} ${rot} 1 0 ${cx - dx} ${cy - dy} Z`;
}
