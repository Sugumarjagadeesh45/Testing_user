declare module '@mapbox/polyline' {
  const polyline: {
    decode(encoded: string, precision?: number): [number, number][];
    encode(coords: [number, number][], precision?: number): string;
  };
  export default polyline;
}
