export type ExitTemplateButton = {
  id: string;
  label: string;
  url: string;
  style: 'solid' | 'outline' | 'ghost';
};
export type ExitTemplate = {
  id: string;
  name: string;
  mode: 'browser' | 'app';
  scheme: string;
  palette: {
    bg: string;
    card: string;
    cardBorder: string;
    text: string;
    sub: string;
    accent: string;
    btnBg: string;
    btnText: string;
    btnBorder: string;
    radius: number;
  };
  background: {
    type: 'color' | 'photo';
    photos: string[];
    blur: number;
    dim: number;
    slideshow: boolean;
    interval: number;
  };
  card: { visible: boolean; opacity: number };
  badge: { show: boolean; text: string };
  heading: string;
  subtext: string;
  buttons: ExitTemplateButton[];
  countdown: number;
  auto: boolean;
};
export const EXIT_TEMPLATE_LIMITS: Readonly<{ buttons: number; photos: number }>;
export function normalizeExitTemplate(raw?: Record<string, unknown>): ExitTemplate;
export function defaultExitTemplate(): ExitTemplate;
export function renderExitTemplatePage(cfg?: Record<string, unknown>): string;
export const EXIT_TEMPLATE_CSS: string;
