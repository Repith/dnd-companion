import { Exclude, Expose } from "class-transformer";
import { GeneratorType, GeneratorStatus } from "./types";

export class GeneratorRequestResponseDto {
  @Expose()
  id!: string;

  @Expose()
  type!: GeneratorType;

  @Expose()
  tags!: string[];

  @Expose()
  prompt?: string | null;

  @Expose()
  status!: GeneratorStatus;

  @Expose()
  resultId?: string | null;

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<GeneratorRequestResponseDto>) {
    Object.assign(this, partial);
  }
}
