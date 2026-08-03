export type ExitPageDefaults = Readonly<{
  mode: 'browser';
  heading: string;
  countdown: number;
  subtext: string;
  button: string;
  customLabel: string;
  customUrl: string;
}>;

export const EXIT_PAGE_DEFAULTS: ExitPageDefaults;
export const EXIT_PAGE_CSS: string;
export function normalizeCountdown(value: unknown): number;
export function isValidCountdownInput(value: unknown): boolean;
export function textOrDefault(value: unknown, fallback: string, maxLength: number): string;
export function textOrEmpty(value: unknown, maxLength: number): string;
export function withExitPageDefaults(value?: Record<string, unknown>): {
  mode: 'browser' | 'app';
  heading: string;
  countdown: number;
  subtext: string;
  button: string;
  customLabel: string;
  customUrl: string;
};
export function normalizeLandingFields(value?: Record<string, unknown>): Record<string, unknown>;
