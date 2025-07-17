// filepath: document_crud/api/index.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ExpressAdapter } from "@nestjs/platform-express";
import { INestApplication } from "@nestjs/common";
import { Request, Response } from "express";
import express from "express";
import * as dotenv from "dotenv";

dotenv.config(); // Load .env variables

const server = express();

let app: INestApplication;

async function createNestApp(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors({
      origin: ["http://localhost:8080", "https://rag-ui-demo.vercel.app"],
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle("Document CRUD API")
      .setDescription("API for managing documents (.txt, .pdf, .docx)")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    await app.init();
  }
  return app;
}

export default async (req: Request, res: Response) => {
  await createNestApp();
  return server(req, res);
};
