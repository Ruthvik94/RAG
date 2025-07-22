import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import axios from "axios";

@Injectable()
export class PythonUpstashService {
  private readonly pythonRagHost: string;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === "development" || false;
    this.pythonRagHost =
      (isDevelopment ? "http://localhost:8000" : process.env.PYTHON_RAG_HOST) ||
      "http://localhost:8000";
    console.log(`🚀 Python RAG Host configured: ${this.pythonRagHost}`);
  }

  ingestFile(filename: string, fileBuffer: Buffer): Promise<any> {
    console.log(`📁 Starting ingestion for file: ${filename}`);
    console.log(
      `📊 File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`
    );

    // Use 'form-data' package for Node.js serverless environments
    // @ts-ignore
    // const FormData = require("form-data");

    // Determine MIME type based on file extension (only allowed types)
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split(".").pop();
      switch (ext) {
        case "pdf":
          return "application/pdf";
        case "txt":
          return "text/plain";
        case "docx":
          return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        default:
          throw new HttpException(
            `Unsupported file type: .${ext}. Only .txt, .docx, and .pdf files are allowed.`,
            HttpStatus.UNSUPPORTED_MEDIA_TYPE
          );
      }
    };

    const contentType = getContentType(filename);
    // Debug: Log buffer info before sending to Python
    const previewBytes = fileBuffer.slice(0, 32).toString("hex");
    console.log(
      `🪵 [DEBUG] Uploading to /rag/ingest: filename=${filename}, contentType=${contentType}, bufferLength=${fileBuffer.length}, bufferPreview(hex)=${previewBytes}`
    );
    const formData = new FormData();
    formData.append("file", fileBuffer, { filename, contentType });

    console.log(`📄 File type detected: ${contentType}`);
    console.log(
      `📦 FormData created with file: ${filename}, size: ${fileBuffer.length} bytes`
    );

    // Vercel-compatible timeout calculation
    const fileSizeMB = fileBuffer.length / (1024 * 1024);

    // File size check - 5MB limit for all environments
    if (fileSizeMB > 5) {
      return Promise.reject(
        new HttpException(
          "File too large (max 5MB allowed)",
          HttpStatus.PAYLOAD_TOO_LARGE
        )
      );
    }

    // Conservative timeouts for Vercel deployment
    // Hobby plan: 300s max, Pro plan: 900s max
    const maxTimeout = process.env.VERCEL_ENV ? 290000 : 120000; // 290s for Vercel, 120s for local
    const timeoutMs = Math.min(
      maxTimeout,
      Math.max(290000, fileSizeMB * 15000)
    ); // 290s min, +15s per MB, capped

    console.log(
      `⏱️  Vercel-compatible timeout: ${timeoutMs}ms (max: ${maxTimeout}ms)`
    );

    // Additional check for Vercel - recommend smaller files for better performance
    if (process.env.VERCEL_ENV && fileSizeMB > 4) {
      console.warn(
        `⚠️  Large file (${fileSizeMB.toFixed(
          2
        )}MB) on Vercel - processing may take longer with 300s timeout`
      );
    }

    return axios
      .post(`${this.pythonRagHost}/rag/ingest/`, formData, {
        headers: {
          ...formData.getHeaders(),
          Accept: "application/json",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: timeoutMs,
      })
      .then((response) => {
        console.log(`✅ Ingestion completed successfully for: ${filename}`);
        return {
          status: "success",
          data: response.data,
          message: `File ${filename} processed successfully`,
        };
      })
      .catch((error: any) => {
        console.error(`❌ Ingestion failed for ${filename}:`, error.message);

        if (error.code === "ECONNABORTED") {
          throw new HttpException(
            "Ingestion timeout - file may be too large",
            HttpStatus.REQUEST_TIMEOUT
          );
        }

        if (error.code === "ECONNREFUSED" || error.message?.includes("axios")) {
          throw new HttpException(
            "Python RAG service is not available",
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }

        if (error.response && error.response.data) {
          const status =
            error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
          throw new HttpException(
            `HTTP ${status}: ${JSON.stringify(error.response.data)}`,
            status
          );
        }

        throw new HttpException(
          `Ingestion failed: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  query(question: string): Promise<any> {
    console.log(`🔍 Processing query: ${question.substring(0, 50)}...`);

    // Vercel-compatible query timeout
    const queryTimeout = process.env.VERCEL_ENV ? 290000 : 120000; // 290s for Vercel Hobby, 120s for local
    console.log(`⏱️  Query timeout: ${queryTimeout}ms`);

    return axios
      .post(
        `${this.pythonRagHost}/rag/query/`,
        { question },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: queryTimeout,
        }
      )
      .then((response) => {
        console.log(`✅ Query completed successfully`);
        return {
          status: "success",
          answer: response.data.answer,
        };
      })
      .catch((error: any) => {
        console.error(`❌ Query failed:`, error.message);

        if (error.code === "ECONNABORTED") {
          throw new HttpException("Query timeout", HttpStatus.REQUEST_TIMEOUT);
        }

        if (error.code === "ECONNREFUSED" || error.message?.includes("axios")) {
          throw new HttpException(
            "Python RAG service is not available",
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }

        if (error.response && error.response.data) {
          const status =
            error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
          throw new HttpException(
            `HTTP ${status}: ${JSON.stringify(error.response.data)}`,
            status
          );
        }

        throw new HttpException(
          `Query failed: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  loadSampleDataset(): Promise<any> {
    console.log(`📚 Loading sample SQuAD dataset`);

    try {
      // Path to the squad.pdf file in the data directory
      const squadFilePath = path.join(process.cwd(), "data", "squad.pdf");

      // Check if file exists
      if (!fs.existsSync(squadFilePath)) {
        console.error(`❌ SQuAD dataset file not found at: ${squadFilePath}`);
        return Promise.reject(
          new HttpException(
            "SQuAD dataset file not found on server",
            HttpStatus.NOT_FOUND
          )
        );
      }

      // Read the file
      const fileBuffer = fs.readFileSync(squadFilePath);
      const filename = "squad.pdf";

      console.log(
        `📄 SQuAD dataset file loaded: ${filename} (${(
          fileBuffer.length /
          1024 /
          1024
        ).toFixed(2)}MB)`
      );

      // Use the existing ingestFile method to process the squad.pdf
      return this.ingestFile(filename, fileBuffer)
        .then((result) => {
          console.log(`✅ SQuAD dataset loaded successfully`);
          return {
            status: "success",
            message: "SQuAD dataset has been loaded and ingested successfully",
            data: result.data,
          };
        })
        .catch((error) => {
          console.error(`❌ Failed to load SQuAD dataset:`, error.message);
          throw error; // Re-throw the error from ingestFile
        });
    } catch (error: any) {
      console.error(`❌ Error reading SQuAD dataset file:`, error.message);
      return Promise.reject(
        new HttpException(
          `Failed to read SQuAD dataset file: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    }
  }

  async clearAllDocuments(): Promise<any> {
    console.log(`🗑️  Initiating clear all documents request`);

    try {
      const response = await axios.delete(
        `${this.pythonRagHost}/rag/clear-documents/`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          data: {},
          timeout: 290000,
        }
      );

      const result = response.data;
      console.log(
        `✅ Successfully cleared documents: ${
          result.deleted_count || 0
        } removed`
      );

      return {
        status: "success",
        data: result,
        message: result.message || "Documents cleared successfully",
      };
    } catch (error: any) {
      console.error(`❌ Clear documents failed:`, error.message);

      if (error.code === "ECONNABORTED") {
        throw new HttpException(
          "Clear operation timeout - operation may have taken too long",
          HttpStatus.REQUEST_TIMEOUT
        );
      }

      if (error.code === "ECONNREFUSED" || error.message?.includes("axios")) {
        throw new HttpException(
          "Python RAG service is not available",
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      if (error.response && error.response.data) {
        const status =
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
        throw new HttpException(
          `HTTP ${status}: ${JSON.stringify(error.response.data)}`,
          status
        );
      }

      throw new HttpException(
        `Clear operation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
