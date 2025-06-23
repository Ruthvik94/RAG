import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from '../documents.controller';
import { DocumentsService } from '../documents.service';
import { Document as DocumentEntity } from '../documents.entity';

const mockDocument: DocumentEntity = {
  id: 1,
  filename: 'test.txt',
  mimetype: 'text/plain',
  size: 100,
  path: 'uploads/test.txt',
  createdAt: new Date(),
  // Add any other required properties from Document entity here
};

const mockDocumentsService = {
  findAll: jest.fn().mockResolvedValue([mockDocument]),
  findById: jest.fn().mockResolvedValue(mockDocument),
  create: jest.fn().mockResolvedValue(mockDocument),
  update: jest.fn().mockResolvedValue(mockDocument),
  remove: jest.fn().mockResolvedValue({ deleted: true }),
};

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all documents', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockDocument]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return a document by id', async () => {
    // Mock Express response
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;
    // Mock fs.readFileSync
    jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(Buffer.from('test content'));
    await controller.findOne(1, res);
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(res.setHeader).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('should create a document', async () => {
    const file = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
      path: 'uploads/test.txt',
    } as Express.Multer.File;
    const result = await controller.uploadFile(file);
    expect(result).toEqual(mockDocument);
    expect(service.create).toHaveBeenCalled();
  });

  it('should update a document', async () => {
    const file = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
      path: 'uploads/test.txt',
    } as Express.Multer.File;
    const result = await controller.updateFile(1, file);
    expect(result).toEqual(mockDocument);
    expect(service.update).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('should delete a document', async () => {
    const result = await controller.remove(1);
    expect(result).toEqual({ deleted: true });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});