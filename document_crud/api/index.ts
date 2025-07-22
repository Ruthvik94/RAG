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
    const isDevelopment = process.env.NODE_ENV === "development";
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "undefined"}`);

    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: isDevelopment ? ["log", "error", "warn", "debug"] : false,
    });

    app.enableCors({
      origin: ["http://localhost:8080", "https://rag-ui-demo.vercel.app"],
      credentials: true,
    });

    // Setup Swagger only in development
    if (isDevelopment) {
      const config = new DocumentBuilder()
        .setTitle("Document CRUD API")
        .setDescription("API for managing documents (.txt, .pdf, .docx)")
        .setVersion("1.0")
        .addTag("Documents")
        .addTag("Health")
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup("docs", app, document);

      console.log(
        "📚 Swagger docs will be available at: http://localhost:3000/docs"
      );
    }

    await app.init();
    console.log(`✅ NestJS app initialized (development: ${isDevelopment})`);
  }
  return app;
}

// For local development, start a proper server
if (process.env.NODE_ENV === "development") {
  const PORT = process.env.PORT || 3000;

  createNestApp().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  });
}

export default async (req: Request, res: Response) => {
  await createNestApp();
  return server(req, res);
};
