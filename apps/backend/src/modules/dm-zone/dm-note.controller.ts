import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../../common/types";
import { DMNoteService } from "./dm-note.service";
import {
  CreateDMNoteDto,
  UpdateDMNoteDto,
  DMNoteResponseDto,
  CreateLinkDto,
  LinkResponseDto,
} from "./dto";

@Controller("dm-notes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DMNoteController {
  constructor(private readonly dmNoteService: DMNoteService) {}

  @Post()
  async create(
    @Body() createDto: CreateDMNoteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DMNoteResponseDto> {
    return this.dmNoteService.create(createDto, "", req.user.id); // campaignId not used for now
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
  ): Promise<DMNoteResponseDto[]> {
    return this.dmNoteService.findAll("", req.user.id); // campaignId not used for now
  }

  @Get(":id")
  async findById(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DMNoteResponseDto | null> {
    return this.dmNoteService.findById(id, req.user.id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateDMNoteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DMNoteResponseDto> {
    return this.dmNoteService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.dmNoteService.delete(id, req.user.id);
  }

  @Post(":id/links")
  async createLink(
    @Param("id") noteId: string,
    @Body() linkDto: CreateLinkDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LinkResponseDto> {
    return this.dmNoteService.createLink(noteId, linkDto, req.user.id);
  }

  @Get(":id/links")
  async getLinks(
    @Param("id") noteId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<LinkResponseDto[]> {
    return this.dmNoteService.getLinks(noteId, req.user.id);
  }

  @Delete("links/:linkId")
  async deleteLink(
    @Param("linkId") linkId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.dmNoteService.deleteLink(linkId, req.user.id);
  }
}
