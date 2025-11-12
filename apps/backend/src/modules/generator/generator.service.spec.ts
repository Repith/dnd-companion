import { Test, TestingModule } from "@nestjs/testing";
import { GeneratorService } from "./generator.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateGeneratorRequestDto, GeneratorType } from "./dto";

describe("GeneratorService", () => {
  let service: GeneratorService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    generatorRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    generatedEntity: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GeneratorService>(GeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createRequest", () => {
    it("should create a generator request and start processing", async () => {
      const createDto: CreateGeneratorRequestDto = {
        type: GeneratorType.NPC,
        tags: ["medieval"],
        prompt: "Generate a knight",
      };

      const mockRequest = {
        id: "request-id",
        type: GeneratorType.NPC,
        tags: ["medieval"],
        prompt: "Generate a knight",
        status: "PENDING",
        resultId: null,
        createdAt: new Date(),
      };

      mockPrismaService.generatorRequest.create.mockResolvedValue(mockRequest);

      const result = await service.createRequest(createDto);

      expect(mockPrismaService.generatorRequest.create).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
          tags: createDto.tags,
          prompt: createDto.prompt,
        },
      });
      expect(result).toBeDefined();
      expect(result.type).toBe(GeneratorType.NPC);
    });
  });

  describe("findAllRequests", () => {
    it("should return all generator requests", async () => {
      const mockRequests = [
        {
          id: "request-1",
          type: GeneratorType.NPC,
          tags: [],
          prompt: null,
          status: "COMPLETED",
          resultId: "entity-1",
          createdAt: new Date(),
        },
      ];

      mockPrismaService.generatorRequest.findMany.mockResolvedValue(
        mockRequests,
      );

      const result = await service.findAllRequests();

      expect(mockPrismaService.generatorRequest.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findRequestById", () => {
    it("should return a generator request by id", async () => {
      const mockRequest = {
        id: "request-1",
        type: GeneratorType.NPC,
        tags: [],
        prompt: null,
        status: "COMPLETED",
        resultId: "entity-1",
        createdAt: new Date(),
      };

      mockPrismaService.generatorRequest.findUnique.mockResolvedValue(
        mockRequest,
      );

      const result = await service.findRequestById("request-1");

      expect(
        mockPrismaService.generatorRequest.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: "request-1" },
      });
      expect(result.id).toBe("request-1");
    });

    it("should throw NotFoundException if request not found", async () => {
      mockPrismaService.generatorRequest.findUnique.mockResolvedValue(null);

      await expect(service.findRequestById("non-existent")).rejects.toThrow(
        "Generator request not found",
      );
    });
  });

  describe("findGeneratedEntityById", () => {
    it("should return a generated entity by id", async () => {
      const mockEntity = {
        id: "entity-1",
        entityType: "NPC",
        data: { name: "Test NPC" },
        createdAt: new Date(),
      };

      mockPrismaService.generatedEntity.findUnique.mockResolvedValue(
        mockEntity,
      );

      const result = await service.findGeneratedEntityById("entity-1");

      expect(mockPrismaService.generatedEntity.findUnique).toHaveBeenCalledWith(
        {
          where: { id: "entity-1" },
        },
      );
      expect(result.id).toBe("entity-1");
    });

    it("should throw NotFoundException if entity not found", async () => {
      mockPrismaService.generatedEntity.findUnique.mockResolvedValue(null);

      await expect(
        service.findGeneratedEntityById("non-existent"),
      ).rejects.toThrow("Generated entity not found");
    });
  });
});
