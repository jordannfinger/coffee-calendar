import { PROCESSES, PROCESS_SUBTYPES, ROAST_LEVELS, type Process, type RoastLevel } from "./types";
import { PROCESS_OFFSETS, ROAST_LEVEL_FACTORS } from "./model";

export const PROCESS_OPTIONS: Array<{ value: Process; label: string }> = PROCESSES.map((value) => ({
  value,
  label: PROCESS_OFFSETS[value].label,
}));

export const ROAST_LEVEL_OPTIONS: Array<{ value: RoastLevel; label: string }> = ROAST_LEVELS.map((value) => ({
  value,
  label: ROAST_LEVEL_FACTORS[value].label,
}));

export function subtypesFor(process: Process): string[] {
  return PROCESS_SUBTYPES[process] ?? [];
}
