import { Item } from "../entities/Item";

export interface ItemRepository {
  findById(id: string): Promise<Item | null>;
  save(item: Item): Promise<void>;
  findAll(): Promise<Item[]>;
  delete(id: string): Promise<void>;
}
