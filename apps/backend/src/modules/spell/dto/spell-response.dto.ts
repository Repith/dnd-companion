import { Exclude, Expose } from "class-transformer";
import { SpellSchool } from "./types";

export class SpellResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  level!: number;

  @Expose()
  school?: SpellSchool;

  @Expose()
  castingTime?: string;

  @Expose()
  range?: string;

  @Expose()
  components?: any;

  @Expose()
  duration!: any;

  @Expose()
  classes!: string[];

  @Expose()
  description?: string;

  @Expose()
  higherLevel?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<SpellResponseDto>) {
    Object.assign(this, partial);
  }
}
