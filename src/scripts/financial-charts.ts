import {
  buildFinancialScale,
  formatFinancialAxisValue,
  type FinancialChartMetricId,
} from '../lib/financial-chart-format';

type ChartPoint = {
  period: string;
  endDate: string;
  value: number;
  exactValue: string;
  compactValue: string;
  tooltipValue: string;
  change: null | {
    label: string;
    text: string;
    direction: 'positive' | 'negative' | 'flat';
  };
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const registeredPlots = new WeakSet<HTMLElement>();
let resizeObserver: ResizeObserver | null = null;

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number> = {},
) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function parsePoints(plot: HTMLElement): ChartPoint[] {
  try {
    const points = JSON.parse(plot.dataset.series || '[]');
    return Array.isArray(points) ? points : [];
  } catch {
    return [];
  }
}

function hideTooltip(tooltip: HTMLElement) {
  tooltip.hidden = true;
  delete tooltip.dataset.activeIndex;
  delete tooltip.dataset.pinned;
}

function showTooltip(
  plot: HTMLElement,
  tooltip: HTMLElement,
  point: ChartPoint,
  index: number,
  x: number,
  y: number,
) {
  const period = document.createElement('strong');
  period.textContent = point.period;
  const value = document.createElement('span');
  value.textContent = `${plot.dataset.title || '指標'}：${point.tooltipValue}`;
  tooltip.replaceChildren(period, value);

  if (point.change) {
    const change = document.createElement('small');
    change.className = `is-${point.change.direction}`;
    change.textContent = `${point.change.label} ${point.change.text}`;
    tooltip.append(change);
  }

  tooltip.hidden = false;
  tooltip.dataset.activeIndex = String(index);
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const left = Math.max(6, Math.min(plot.clientWidth - tooltipWidth - 6, x - tooltipWidth / 2));
  const preferredTop = y - tooltipHeight - 12;
  const top = preferredTop >= 4 ? preferredTop : y + 12;
  tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

function renderFinancialChart(plot: HTMLElement) {
  const svg = plot.querySelector<SVGSVGElement>('.financial-trend-svg');
  const tooltip = plot.querySelector<HTMLElement>('.financial-chart-tooltip');
  if (!svg || !tooltip) return;

  const width = Math.round(plot.getBoundingClientRect().width);
  if (width < 240) return;
  hideTooltip(tooltip);

  const points = parsePoints(plot);
  if (points.length === 0) return;
  const metricId = (plot.dataset.metricId || 'revenue') as FinancialChartMetricId;
  const currency = plot.dataset.currency || '';
  const unit = plot.dataset.unit || '';
  const isNarrow = width < 440;
  const height = isNarrow ? 226 : 240;
  const padding = {
    left: isNarrow ? 50 : 60,
    right: isNarrow ? 10 : 14,
    top: 14,
    bottom: 40,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scale = buildFinancialScale(points.map(point => point.value));
  const xFor = (index: number) => points.length <= 1
    ? padding.left + plotWidth / 2
    : padding.left + (plotWidth * index) / (points.length - 1);
  const yFor = (value: number) => padding.top
    + plotHeight
    - ((value - scale.min) / Math.max(scale.max - scale.min, 1)) * plotHeight;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.style.height = `${height}px`;
  svg.replaceChildren();

  scale.ticks.forEach(tick => {
    const y = yFor(tick);
    const line = svgElement('line', {
      class: tick === 0 ? 'chart-grid chart-zero-line' : 'chart-grid',
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
    });
    const label = svgElement('text', {
      class: 'chart-y-label',
      x: padding.left - 8,
      y: y + 4,
      'text-anchor': 'end',
    });
    label.textContent = formatFinancialAxisValue(tick, metricId, currency, unit);
    svg.append(line, label);
  });

  const labelIndexes = isNarrow && points.length > 3
    ? new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])
    : new Set(points.map((_, index) => index));
  points.forEach((point, index) => {
    if (!labelIndexes.has(index)) return;
    const label = svgElement('text', {
      class: 'chart-period',
      x: xFor(index),
      y: height - 14,
      'text-anchor': index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle',
    });
    label.textContent = point.period;
    svg.append(label);
  });

  if (points.length > 1) {
    const line = svgElement('polyline', {
      class: 'chart-trend-line',
      points: points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(' '),
    });
    svg.append(line);
  }

  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    const group = svgElement('g', {
      class: 'chart-point-group',
      tabindex: 0,
      role: 'button',
      'aria-label': `${point.period} ${plot.dataset.title || '指標'} ${point.tooltipValue}`,
    });
    const visiblePoint = svgElement('circle', { class: 'chart-point', cx: x, cy: y, r: index === points.length - 1 ? 4.5 : 4 });
    const hitArea = svgElement('circle', { class: 'chart-hit-area', cx: x, cy: y, r: 14 });
    group.append(visiblePoint, hitArea);

    const display = () => showTooltip(plot, tooltip, point, index, x, y);
    group.addEventListener('pointerenter', event => {
      if ((event as PointerEvent).pointerType !== 'touch' && tooltip.dataset.pinned !== 'true') display();
    });
    group.addEventListener('pointermove', event => {
      if ((event as PointerEvent).pointerType !== 'touch' && tooltip.dataset.pinned !== 'true') display();
    });
    group.addEventListener('pointerleave', event => {
      if ((event as PointerEvent).pointerType !== 'touch' && tooltip.dataset.pinned !== 'true') hideTooltip(tooltip);
    });
    group.addEventListener('focus', display);
    group.addEventListener('blur', () => {
      if (tooltip.dataset.pinned !== 'true') hideTooltip(tooltip);
    });
    group.addEventListener('click', event => {
      event.stopPropagation();
      if (tooltip.dataset.activeIndex === String(index) && tooltip.dataset.pinned === 'true' && !tooltip.hidden) {
        hideTooltip(tooltip);
      } else {
        display();
        tooltip.dataset.pinned = 'true';
      }
    });
    group.addEventListener('keydown', event => {
      if ((event as KeyboardEvent).key === 'Escape') hideTooltip(tooltip);
    });
    svg.append(group);
  });
}

function registerPlot(plot: HTMLElement) {
  if (registeredPlots.has(plot)) return;
  registeredPlots.add(plot);
  resizeObserver?.observe(plot);
  plot.addEventListener('click', event => {
    if (!(event.target as Element).closest('.chart-point-group')) {
      const tooltip = plot.querySelector<HTMLElement>('.financial-chart-tooltip');
      if (tooltip) hideTooltip(tooltip);
    }
  });
  renderFinancialChart(plot);
}

export function initializeFinancialCharts() {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => renderFinancialChart(entry.target as HTMLElement));
    });
  }
  document.querySelectorAll<HTMLElement>('[data-financial-trend]').forEach(registerPlot);
}
