import {
  Controller, Get, Post, Put, Delete, Param, UploadedFile, UseInterceptors, Body, Res, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { extname } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Document as DocumentEntity } from './documents.entity';

const allowedExtensions = ['.txt', '.pdf', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(): Promise<DocumentEntity[]> {
    return this.documentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<Response> {
    const doc = await this.documentsService.findById(id);
    const fileContent = fs.readFileSync(doc.path);
    res.setHeader('Content-Type', doc.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    return res.status(HttpStatus.OK).send(fileContent);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const ext = extname(file.originalname);
        if (!allowedExtensions.includes(ext)) {
          return cb(new Error('Invalid file type'), '');
        }
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const ext = extname(file.originalname);
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error('Only .txt, .pdf, .docx files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_FILE_SIZE }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<DocumentEntity> {
    if (!file) {
      throw new BadRequestException('File is required and must be less than 5MB.');
    }

    const dto: CreateDocumentDto = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
    return this.documentsService.create(dto);
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const ext = extname(file.originalname);
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error('Only .txt, .pdf, .docx files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_FILE_SIZE }
  }))
  async updateFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentEntity> {
    if (!file) {
      throw new BadRequestException('File is required and must be less than 5MB.');
    }

    const dto: UpdateDocumentDto = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }>  {
    await this.documentsService.remove(id);
    return { deleted: true };
  }
}