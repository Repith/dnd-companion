import { Exclude, Expose } from "class-transformer";
import { Role, SubscriptionTier } from "./types";

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  username?: string | null;

  @Expose()
  email!: string;

  @Expose()
  roles!: Role[];

  @Expose()
  subscriptionTier!: SubscriptionTier;

  @Expose()
  profile?: any | null;

  @Expose()
  lastLogin!: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  passwordHash!: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
