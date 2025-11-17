import { CampaignStatus } from "../enums/campaign-status";

export class Campaign {
  public readonly id: string;
  private _name: string;
  private _status: CampaignStatus;

  constructor(id: string, name: string, status: CampaignStatus) {
    this.id = id;
    this._name = name;
    this._status = status;
  }

  get name(): string {
    return this._name;
  }

  get status(): CampaignStatus {
    return this._status;
  }
}
