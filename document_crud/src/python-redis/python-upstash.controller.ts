import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiBody } from "@nestjs/swagger";
import { PythonUpstashService } from "./python-upstash.service";

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
  async ingestFile(@UploadedFile() file: Express.Multer.File) {
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
}
