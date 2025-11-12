import {
  GeneratorType as GeneratorTypeConst,
  GeneratorStatus as GeneratorStatusConst,
} from "@prisma/client";
import type {
  GeneratorType as GeneratorTypeType,
  GeneratorStatus as GeneratorStatusType,
} from "@prisma/client";

export const GeneratorType = GeneratorTypeConst;
export type GeneratorType = GeneratorTypeType;

export const GeneratorStatus = GeneratorStatusConst;
export type GeneratorStatus = GeneratorStatusType;
