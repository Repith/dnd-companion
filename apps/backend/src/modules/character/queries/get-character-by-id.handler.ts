import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { CharacterService } from "../character.service";
import { GetCharacterByIdQuery } from "./get-character-by-id.query";
import { CharacterResponseDto } from "../dto";

@Injectable()
@QueryHandler(GetCharacterByIdQuery)
export class GetCharacterByIdHandler
  implements IQueryHandler<GetCharacterByIdQuery, CharacterResponseDto>
{
  constructor(private readonly characterService: CharacterService) {}

  async execute(query: GetCharacterByIdQuery): Promise<CharacterResponseDto> {
    const { id, userId } = query;
    return this.characterService.findOne(id, userId);
  }
}
