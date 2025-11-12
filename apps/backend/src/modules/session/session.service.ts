import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateSessionDto,
  SessionResponseDto,
  CreateEventDto,
  EventResponseDto,
} from "./dto";
import { CampaignService } from "../campaign/campaign.service";
import { EventType } from "../campaign/dto/types";
import { Session } from "@prisma/client";

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
  ) {}

  async create(
    createDto: CreateSessionDto,
    campaignId: string,
    userId: string,
  ): Promise<SessionResponseDto> {
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can create sessions");
    }

    const session = await this.prisma.session.create({
      data: {
        ...createDto,
        campaignId,
      },
    });

    // Set as current session for the campaign
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { currentSessionId: session.id },
    });

    return new SessionResponseDto(session);
  }

  async findAll(
    campaignId: string,
    userId: string,
  ): Promise<SessionResponseDto[]> {
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const sessions = await this.prisma.session.findMany({
      where: { campaignId },
      orderBy: { date: "desc" },
    });

    return sessions.map((session: Session) => new SessionResponseDto(session));
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<SessionResponseDto | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        campaign: true,
        events: {
          include: {
            actor: true,
            target: true,
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!session) {
      return null;
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      session.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    return new SessionResponseDto(session);
  }

  async update(
    id: string,
    updateDto: Partial<CreateSessionDto>,
    userId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      session.campaignId,
      userId,
    );
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can update sessions");
    }

    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: updateDto,
    });

    return new SessionResponseDto(updatedSession);
  }

  async delete(id: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      session.campaignId,
      userId,
    );
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can delete sessions");
    }

    await this.prisma.session.delete({
      where: { id },
    });
  }

  async logEvent(
    sessionId: string,
    eventDto: CreateEventDto,
    userId: string,
  ): Promise<EventResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      session.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const event = await this.prisma.gameEvent.create({
      data: {
        ...eventDto,
        sessionId,
      },
    });

    // Publish event to event bus (simplified - in real implementation would use a message broker)
    await this.publishEvent(event);

    return new EventResponseDto(event);
  }

  async getEvents(
    sessionId: string,
    userId: string,
  ): Promise<EventResponseDto[]> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      session.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const events = await this.prisma.gameEvent.findMany({
      where: { sessionId },
      include: {
        actor: true,
        target: true,
      },
      orderBy: { timestamp: "asc" },
    });

    return events.map((event: EventResponseDto) => new EventResponseDto(event));
  }

  async adjustHP(
    sessionId: string,
    characterId: string,
    hpAdjustment: number,
    userId: string,
  ): Promise<EventResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      session.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    // Get the character
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    // Calculate new HP values
    const currentHP = (character.hitPoints as any).current || 0;
    const maxHP = (character.hitPoints as any).max || 0;
    const temporaryHP = (character.hitPoints as any).temporary || 0;

    let newCurrentHP = currentHP + hpAdjustment;
    let newTemporaryHP = temporaryHP;

    // If healing, cap at max HP
    if (hpAdjustment > 0) {
      newCurrentHP = Math.min(newCurrentHP, maxHP);
    } else {
      // If damage, first reduce temporary HP
      if (temporaryHP > 0) {
        const damage = Math.abs(hpAdjustment);
        if (temporaryHP >= damage) {
          newTemporaryHP = temporaryHP - damage;
        } else {
          newTemporaryHP = 0;
          newCurrentHP = currentHP - (damage - temporaryHP);
        }
      } else {
        newCurrentHP = Math.max(0, newCurrentHP); // Don't go below 0
      }
    }

    // Update character HP
    await this.prisma.character.update({
      where: { id: characterId },
      data: {
        hitPoints: {
          max: maxHP,
          current: newCurrentHP,
          temporary: newTemporaryHP,
        },
      },
    });

    // Log the event
    const eventType =
      hpAdjustment > 0 ? EventType.HEALING_RECEIVED : EventType.DAMAGE_APPLIED;
    const event = await this.prisma.gameEvent.create({
      data: {
        type: eventType,
        actorId: userId, // The user performing the action
        targetId: characterId,
        payload: {
          amount: Math.abs(hpAdjustment),
          newCurrentHP,
          newTemporaryHP,
        },
        sessionId,
      },
    });

    await this.publishEvent(event);

    return new EventResponseDto(event);
  }

  async grantItem(
    sessionId: string,
    characterId: string,
    itemId: string,
    quantity: number = 1,
    userId: string,
  ): Promise<EventResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { campaign: true },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      session.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    // Verify character exists
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    // Verify item exists
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    // Get or create inventory for the character
    let inventory = await this.prisma.inventory.findFirst({
      where: {
        ownerType: "CHARACTER",
        ownerId: characterId,
      },
    });

    if (!inventory) {
      inventory = await this.prisma.inventory.create({
        data: {
          ownerType: "CHARACTER",
          ownerId: characterId,
        },
      });
    }

    // Check if character already has this item
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId: inventory.id,
        itemId,
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Create new inventory item
      await this.prisma.inventoryItem.create({
        data: {
          inventoryId: inventory.id,
          itemId,
          quantity,
        },
      });
    }

    // Log the event
    const event = await this.prisma.gameEvent.create({
      data: {
        type: EventType.ITEM_GIVEN,
        actorId: userId,
        targetId: characterId,
        payload: {
          itemId,
          itemName: item.name,
          quantity,
        },
        sessionId,
      },
    });

    await this.publishEvent(event);

    return new EventResponseDto(event);
  }

  private async publishEvent(event: any): Promise<void> {
    // In a real implementation, this would publish to a message broker like Kafka, RabbitMQ, etc.
    // For now, we'll just log it
    console.log("Event published:", event);

    // Here you could implement real-time notifications via WebSockets, etc.
  }
}
