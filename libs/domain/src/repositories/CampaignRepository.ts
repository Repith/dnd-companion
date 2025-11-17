import { Campaign } from "../entities/Campaign";

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  save(campaign: Campaign): Promise<void>;
  findAll(): Promise<Campaign[]>;
  delete(id: string): Promise<void>;
}
