import { ChartOptions } from 'chart.js';

export function readChartTheme(document: Document) {
  const styles = document.defaultView?.getComputedStyle(document.documentElement);
  const color = (name: string) => styles?.getPropertyValue(`--color-${name}`).trim() ?? '';
  return {
    ink: color('ink'), muted: color('muted'), surface: color('surface'), stroke: color('stroke'),
    colors: Array.from({ length: 7 }, (_, index) => color(`chart-${index + 1}`)),
    fills: [color('chart-fill-1'), color('chart-fill-2')],
  };
}

export function applyChartTheme(chart: { options: ChartOptions<'bar' | 'line' | 'doughnut'> }, theme: ReturnType<typeof readChartTheme>): void {
  if (!chart.options) return;
  chart.options.color = theme.muted;
  const legend = chart.options.plugins?.legend;
  if (legend) legend.labels = { ...legend.labels, color: theme.muted };
  const tooltip = chart.options.plugins?.tooltip;
  if (tooltip) {
    tooltip.backgroundColor = theme.surface;
    tooltip.titleColor = theme.ink;
    tooltip.bodyColor = theme.ink;
    tooltip.borderColor = theme.stroke;
    tooltip.borderWidth = 1;
  }
  for (const axis of Object.values(chart.options.scales ?? {})) {
    if (!axis) continue;
    axis.ticks = { ...axis.ticks, color: theme.muted };
    axis.grid = { ...axis.grid, color: theme.stroke };
    axis.border = { ...axis.border, color: theme.stroke };
  }
}
