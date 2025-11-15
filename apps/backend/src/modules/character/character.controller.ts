import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  Put,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CharacterService } from "./character.service";
import { CreateCharacterDto, UpdateCharacterDto, SkillName } from "./dto";
import { AuthenticatedRequest } from "../../common/types";
import { AddSkillProficiencyCommand } from "./commands/add-skill-proficiency.command";
import { GainExperienceCommand } from "./commands/gain-experience.command";
import { UpdateCharacterLevelCommand } from "./commands/update-character-level.command";

@Controller("characters")
@UseGuards(JwtAuthGuard)
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  create(
    @Body() createCharacterDto: CreateCharacterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.create(createCharacterDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create character",
      );
    }
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.characterService.findAll(req.user.id);
  }

  @Get("demo")
  @UseGuards() // Override class-level guard to make this endpoint public
  findDemoCharacters() {
    return this.characterService.findDemoCharacters();
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.characterService.findOne(id, req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.update(id, updateCharacterDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update character",
      );
    }
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.characterService.remove(id, req.user.id);
  }

  // Spell management endpoints
  @Post(":id/spells/learn")
  learnSpell(
    @Param("id") id: string,
    @Body() body: { spellId: string },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.addKnownSpell(id, body.spellId, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to learn spell",
      );
    }
  }

  @Delete(":id/spells/learn/:spellId")
  unlearnSpell(
    @Param("id") id: string,
    @Param("spellId") spellId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.removeKnownSpell(id, spellId, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to unlearn spell",
      );
    }
  }

  @Post(":id/spells/prepare")
  prepareSpell(
    @Param("id") id: string,
    @Body() body: { spellId: string },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.addPreparedSpell(
        id,
        body.spellId,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to prepare spell",
      );
    }
  }

  @Delete(":id/spells/prepare/:spellId")
  unprepareSpell(
    @Param("id") id: string,
    @Param("spellId") spellId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.removePreparedSpell(
        id,
        spellId,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to unprepare spell",
      );
    }
  }

  @Put(":id/spell-slots")
  updateSpellSlots(
    @Param("id") id: string,
    @Body() body: { remainingSlots: Record<string, number> },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.characterService.updateSpellSlots(
        id,
        body.remainingSlots,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update spell slots",
      );
    }
  }

  @Post(":id/skills/add-proficiency")
  addSkillProficiency(
    @Param("id") id: string,
    @Body() body: { skill: SkillName; proficient: boolean; expertise: boolean },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.commandBus.execute(
        new AddSkillProficiencyCommand(
          id,
          body.skill,
          body.proficient,
          body.expertise,
          req.user.id,
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to add skill proficiency",
      );
    }
  }

  @Post(":id/experience/gain")
  gainExperience(
    @Param("id") id: string,
    @Body() body: { experienceGained: number },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.commandBus.execute(
        new GainExperienceCommand(id, body.experienceGained, req.user.id),
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to gain experience",
      );
    }
  }

  @Post(":id/level/update")
  updateCharacterLevel(
    @Param("id") id: string,
    @Body() body: { newLevel: number },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.commandBus.execute(
        new UpdateCharacterLevelCommand(id, body.newLevel, req.user.id),
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update character level",
      );
    }
  }
}
