import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateDMNoteDto,
  UpdateDMNoteDto,
  DMNoteResponseDto,
  CreateLinkDto,
  LinkResponseDto,
} from "./dto";
import { CampaignService } from "../campaign/campaign.service";

@Injectable()
export class DMNoteService {
  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
  ) {}

  async create(
    createDto: CreateDMNoteDto,
    campaignId: string,
    userId: string,
  ): Promise<DMNoteResponseDto> {
    // Check if user is DM
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can create notes");
    }

    const note = await this.prisma.dMNote.create({
      data: createDto,
    });

    return new DMNoteResponseDto(note);
  }

  async findAll(
    campaignId: string,
    userId: string,
  ): Promise<DMNoteResponseDto[]> {
    // Check if user is in campaign
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const notes = await this.prisma.dMNote.findMany({
      orderBy: { createdAt: "desc" },
    });

    return notes.map((note: DMNoteResponseDto) => new DMNoteResponseDto(note));
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<DMNoteResponseDto | null> {
    // For now, allow any user in any campaign to view notes
    // In a more complex system, you might want to associate notes with campaigns
    const note = await this.prisma.dMNote.findUnique({
      where: { id },
    });

    if (!note) {
      return null;
    }

    return new DMNoteResponseDto(note);
  }

  async update(
    id: string,
    updateDto: UpdateDMNoteDto,
    userId: string,
  ): Promise<DMNoteResponseDto> {
    // For now, allow any user to update notes
    // In production, you might want to restrict this to the creator or DM
    const note = await this.prisma.dMNote.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    const updatedNote = await this.prisma.dMNote.update({
      where: { id },
      data: updateDto,
    });

    return new DMNoteResponseDto(updatedNote);
  }

  async delete(id: string, userId: string): Promise<void> {
    // For now, allow any user to delete notes
    // In production, you might want to restrict this
    const note = await this.prisma.dMNote.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    await this.prisma.dMNote.delete({
      where: { id },
    });
  }

  async createLink(
    noteId: string,
    linkDto: CreateLinkDto,
    userId: string,
  ): Promise<LinkResponseDto> {
    // Verify note exists
    const note = await this.prisma.dMNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    // Validate that the related entity exists based on type
    await this.validateRelatedEntity(
      linkDto.relatedEntityType,
      linkDto.relatedEntityId,
    );

    const link = await this.prisma.link.create({
      data: {
        ...linkDto,
        noteId,
      },
    });

    return new LinkResponseDto(link);
  }

  async getLinks(noteId: string, userId: string): Promise<LinkResponseDto[]> {
    // Verify note exists
    const note = await this.prisma.dMNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    const links = await this.prisma.link.findMany({
      where: { noteId },
    });

    return links.map((link: LinkResponseDto) => new LinkResponseDto(link));
  }

  async deleteLink(linkId: string, userId: string): Promise<void> {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException("Link not found");
    }

    await this.prisma.link.delete({
      where: { id: linkId },
    });
  }

  private async validateRelatedEntity(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    switch (entityType.toUpperCase()) {
      case "LOCATION":
        const location = await this.prisma.location.findUnique({
          where: { id: entityId },
        });
        if (!location) {
          throw new NotFoundException("Location not found");
        }
        break;
      case "CHARACTER":
        const character = await this.prisma.character.findUnique({
          where: { id: entityId },
        });
        if (!character) {
          throw new NotFoundException("Character not found");
        }
        break;
      case "QUEST":
        const quest = await this.prisma.quest.findUnique({
          where: { id: entityId },
        });
        if (!quest) {
          throw new NotFoundException("Quest not found");
        }
        break;
      case "ITEM":
        const item = await this.prisma.item.findUnique({
          where: { id: entityId },
        });
        if (!item) {
          throw new NotFoundException("Item not found");
        }
        break;
      case "SPELL":
        const spell = await this.prisma.spell.findUnique({
          where: { id: entityId },
        });
        if (!spell) {
          throw new NotFoundException("Spell not found");
        }
        break;
      default:
        throw new NotFoundException(`Unknown entity type: ${entityType}`);
    }
  }
}
