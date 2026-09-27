import { formatDateOnly, parseDateOnly } from "./dateUtils";

export class ValidationError extends Error {}

export function requiredText(value: string, label: string): string {
  const text = value.trim();
  if (!text) throw new ValidationError(`${label} is required.`);
  return text;
}

export function validDate(value: string, label: string, latest?: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || formatDateOnly(parseDateOnly(value)) !== value) {
    throw new ValidationError(`${label} must be a valid calendar date.`);
  }
  if (latest && value > latest) throw new ValidationError(`${label} cannot be in the future.`);
  return value;
}

/** Complete decimal conversion; never silently truncate or replace bad input with null. */
export function optionalNumber(value: string, label: string, min: number, max: number, integer = false): number | null {
  const text = value.trim();
  if (!text) return null;
  const number = Number(text);
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(number)) {
    throw new ValidationError(`${label} must be a complete, finite number.`);
  }
  if (integer && !Number.isInteger(number)) throw new ValidationError(`${label} must be a whole number.`);
  if (number < min || number > max) throw new ValidationError(`${label} must be between ${min} and ${max}.`);
  return number;
}
