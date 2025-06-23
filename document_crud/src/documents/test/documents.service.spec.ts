import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from '../documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from '../documents.entity';
import { Repository } from 'typeorm';

const mockDocument = {
  id: 1,
  filename: 'test.txt',
  mimetype: 'text/plain',
  size: 100,
  path: 'uploads/test.txt',
  createdAt: new Date(),
};

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repo: Repository<Document>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: {
            find: jest.fn().mockResolvedValue([mockDocument]),
            findOneBy: jest.fn().mockResolvedValue(mockDocument),
            create: jest.fn().mockReturnValue(mockDocument),
            save: jest.fn().mockResolvedValue(mockDocument),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    repo = module.get<Repository<Document>>(getRepositoryToken(Document));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all documents', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockDocument]);
    expect(repo.find).toHaveBeenCalled();
  });

  it('should return a document by id', async () => {
    const result = await service.findById(1);
    expect(result).toEqual(mockDocument);
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should create a document', async () => {
    const dto = {
      filename: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
      path: 'uploads/test.txt',
    };
    const result = await service.create(dto);
    expect(result).toEqual(mockDocument);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(mockDocument);
  });

  it('should update a document', async () => {
    const dto = {
      filename: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
      path: 'uploads/test.txt',
    };
    const result = await service.update(1, dto);
    expect(result).toEqual(mockDocument);
    expect(repo.update).toHaveBeenCalledWith(1, dto);
  });

  it('should delete a document', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});