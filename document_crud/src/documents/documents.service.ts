import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document as DocumentEntity } from './documents.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
  ) {}

  async findAll(): Promise<DocumentEntity[]> {
    return this.documentsRepository.find();
  }

  async findById(id: number): Promise<DocumentEntity> {
    const doc = await this.documentsRepository.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(createDocumentDto: CreateDocumentDto): Promise<DocumentEntity> {
    const document = this.documentsRepository.create(createDocumentDto);
    return this.documentsRepository.save(document);
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto): Promise<DocumentEntity> {
    await this.documentsRepository.update(id, updateDocumentDto);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.documentsRepository.delete(id);
  }
}