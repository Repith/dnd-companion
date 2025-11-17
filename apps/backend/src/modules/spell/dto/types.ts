export { SpellSchool } from "@dnd-companion/domain";

export interface SpellComponents {
  verbal?: boolean;
  somatic?: boolean;
  material?: string;
  [key: string]: any;
}

export interface SpellDuration {
  duration: string;
  concentration?: boolean;
  [key: string]: any;
}
