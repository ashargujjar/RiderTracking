const PALETTE = ["#1b75bc", "#5b9bd5", "#8dc63f", "#e0574c"];

export function getPlaceholderPhoto(index: number): string {
  const color = PALETTE[index % PALETTE.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <rect width='400' height='400' fill='${color}'/>
    <circle cx='130' cy='120' r='38' fill='rgba(255,255,255,0.85)'/>
    <polygon points='0,400 150,220 230,300 310,190 400,400' fill='rgba(255,255,255,0.55)'/>
    <text x='50%' y='92%' font-family='Segoe UI, sans-serif' font-size='28' fill='rgba(255,255,255,0.95)' text-anchor='middle'>Photo ${index + 1}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
