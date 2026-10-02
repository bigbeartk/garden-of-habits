import type { Art } from './types';

export function ArtView({ art }: { art: Art }) {
  if ('image' in art) {
    return <image href={art.image} x={0} y={0} width={200} height={240} preserveAspectRatio="xMidYMid meet" />;
  }
  const Svg = art.svg;
  return <Svg />;
}
