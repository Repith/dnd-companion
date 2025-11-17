import { Spell } from "../entities/Spell";
import { SpellSchool } from "../enums/spell-school";

export interface SpellFilters {
  level?: number;
  school?: SpellSchool;
  class?: string;
  search?: string;
  userId?: string;
}

export interface SpellRepository {
  findById(id: string): Promise<Spell | null>;
  findByIdWithAccessCheck(id: string, userId?: string): Promise<Spell | null>;
  findAll(): Promise<Spell[]>;
  findAllWithFilters(filters?: SpellFilters): Promise<Spell[]>;
  findByName(name: string): Promise<Spell | null>;
  save(spell: Spell): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  countSpellsUsing(id: string): Promise<number>;
}
