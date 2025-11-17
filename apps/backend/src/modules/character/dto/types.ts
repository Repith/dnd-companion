import { CharacterClass } from "@dnd-companion/domain";

export { Race } from "@dnd-companion/domain";
export { CharacterClass } from "@dnd-companion/domain";
export { Alignment } from "@dnd-companion/domain";
export { SkillName } from "@dnd-companion/domain";
export { AbilityName } from "@dnd-companion/domain";
export { NPCRole } from "@dnd-companion/domain";

export interface MulticlassDto {
  class: CharacterClass;
  level: number;
}
