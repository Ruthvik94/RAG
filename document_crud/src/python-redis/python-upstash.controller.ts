import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiBody } from "@nestjs/swagger";
import { PythonUpstashService } from "./python-upstash.service";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller("api")
export class PythonUpstashController {
  constructor(private readonly pythonUpstashService: PythonUpstashService) {}

  @Post("ingest")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async ingestFile(@UploadedFile() file: MulterFile) {
    if (!file)
      throw new HttpException("File is required", HttpStatus.BAD_REQUEST);
    return this.pythonUpstashService.ingestFile(file.originalname, file.buffer);
  }

  @Post("query")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      required: ["question"],
    },
  })
  async queryPython(@Body("question") question: string) {
    if (!question)
      throw new HttpException("Question is required", HttpStatus.BAD_REQUEST);
    return this.pythonUpstashService.query(question);
  }

  @Post("load-sample-dataset")
  async loadSampleDataset() {
    return this.pythonUpstashService.loadSampleDataset();
  }

  @Post("clear-documents")
  async clearAllDocuments() {
    return this.pythonUpstashService.clearAllDocuments();
  }

  @Get("health")
  async healthCheck() {
    try {
      // Test connection to Python RAG service
      const response = await fetch(
        `${process.env.PYTHON_RAG_HOST || "http://localhost:8000"}/health`
      );

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          nodeProxy: "healthy",
          pythonRag: response.ok ? "healthy" : "unhealthy",
        },
        environment: process.env.NODE_ENV || "development",
      };
    } catch (error) {
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          nodeProxy: "healthy",
          pythonRag: "unreachable",
        },
        environment: process.env.NODE_ENV || "development",
        error: "Python RAG service unreachable",
      };
    }
  }

  @Get("/")
  async hello() {
    return {
      message: "Hello from Document CRUD",
    };
  }
}
