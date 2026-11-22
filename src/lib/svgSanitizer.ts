const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'polygon',
  'polyline',
  'line',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'pattern',
  'title',
  'desc',
  'text',
  'tspan',
  'style',
]);

const ALLOWED_ATTRS = new Set([
  'viewbox',
  'xmlns',
  'width',
  'height',
  'preserveaspectratio',
  'id',
  'class',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'transform',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientunits',
  'gradienttransform',
  'clip-path',
  'mask',
  'font-size',
  'font-weight',
  'font-family',
  'text-anchor',
  'dominant-baseline',
  'dx',
  'dy',
]);

function isSafeValue(attrName: string, value: string): boolean {
  const lower = value.toLowerCase().trim();
  if (lower.includes('javascript:') || lower.includes('data:text/html') || lower.includes('expression(')) {
    return false;
  }
  // Allow internal url(#id) references for gradients/clips, block external url(http...)
  if (lower.includes('url(') && !/^url\(#[\w-]+\)$/i.test(lower)) {
    return false;
  }
  if (attrName.startsWith('on')) {
    return false;
  }
  return true;
}

function sanitizeStyleText(cssText: string): string {
  // Strip @import or external url() inside inline SVG <style> blocks
  return cssText
    .replace(/@import[^;]+;/gi, '')
    .replace(/url\([^)]*\)/gi, '')
    .replace(/expression\([^)]*\)/gi, '');
}

function cleanNode(node: Element): void {
  const children = Array.from(node.children);
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      child.remove();
      continue;
    }

    if (tag === 'style') {
      child.textContent = sanitizeStyleText(child.textContent || '');
    }

    const attrs = Array.from(child.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name) || !isSafeValue(name, attr.value)) {
        child.removeAttribute(attr.name);
      }
    }

    cleanNode(child);
  }
}

export function sanitizeSvg(rawSvg: string | undefined | null): string | null {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return null;
  }

  const trimmed = rawSvg.trim();
  if (!trimmed.includes('<svg')) {
    return null;
  }

  // Extract just the <svg>...</svg> block in case an LLM added stray text
  const match = trimmed.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(match[0], 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    const svgEl = doc.documentElement;

    if (parserError || !svgEl || svgEl.tagName.toLowerCase() !== 'svg') {
      return null;
    }

    // Clean root attributes
    for (const attr of Array.from(svgEl.attributes)) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name) || !isSafeValue(name, attr.value)) {
        svgEl.removeAttribute(attr.name);
      }
    }

    if (!svgEl.getAttribute('viewBox')) {
      svgEl.setAttribute('viewBox', '0 0 400 300');
    }
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    cleanNode(svgEl);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgEl);
  } catch {
    return null;
  }
}
