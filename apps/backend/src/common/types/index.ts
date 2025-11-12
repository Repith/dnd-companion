import { Request } from "express";

export interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export enum Role {
  PLAYER = "PLAYER",
  DM = "DM",
  ADMIN = "ADMIN",
}
