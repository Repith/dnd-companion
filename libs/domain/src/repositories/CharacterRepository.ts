import { Character } from "../entities/Character";

export interface CharacterRepository {
  findById(id: string): Promise<Character | null>;
  findByIdWithAccessCheck(
    id: string,
    userId?: string,
  ): Promise<Character | null>;
  findAllForUser(userId: string): Promise<Character[]>;
  findDemoCharacters(): Promise<Character[]>;
  save(character: Character): Promise<void>;
  updateLevel(
    id: string,
    level: number,
    proficiencyBonus: number,
  ): Promise<void>;
  updateExperience(id: string, experiencePoints: number): Promise<void>;
  delete(id: string): Promise<void>;
}
