import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PythonUpstashService {
  private redisPub = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    }
  );

  private redisSub = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    }
  );
  async ingestFile(filename: string, fileBuffer: Buffer): Promise<any> {
    const requestId = uuidv4();
    const fileContent = fileBuffer.toString("base64");
    const payload = {
      filename,
      file_content: fileContent,
      request_id: requestId,
    };

    // Calculate timeout based on file size (e.g., 30 seconds per MB)
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    const timeoutMs = Math.max(60000, fileSizeMB * 30000); // Increased minimum to 60s

    console.log(
      `File size: ${fileSizeMB.toFixed(2)}MB, Timeout: ${timeoutMs}ms`
    );

    this.redisPub
      .publish("ingest_requests", JSON.stringify(payload))
      .then(() => {
        console.log(
          "Published ingest request:",
          payload.filename,
          payload.request_id
        );
      })
      .catch((error) => {
        console.error("Failed to publish ingest request:", error);
      });

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const handler = (channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.request_id === requestId) {
            this.redisSub.removeListener("message", handler);
            if (timeoutId) clearTimeout(timeoutId);
            resolve(data);
          }
        } catch (parseError) {
          console.error(
            "Failed to parse Redis message:",
            parseError,
            "Message:",
            message
          );
        }
      };

      this.redisSub.on("message", handler);
      this.redisSub
        .subscribe("ingest_responses")
        .then(() => {
          console.log("Successfully subscribed to ingest_responses");
          // Set timeout after successful subscription
          timeoutId = setTimeout(() => {
            this.redisSub.removeListener("message", handler);
            reject(
              new Error(
                `Timeout waiting for ingest response after ${timeoutMs}ms`
              )
            );
          }, timeoutMs);
        })
        .catch((subscribeError) => {
          console.error(
            "Failed to subscribe to ingest_responses:",
            subscribeError
          );
          this.redisSub.removeListener("message", handler);
          reject(new Error(`Subscription failed: ${subscribeError.message}`));
        });
    });
  }

  async query(question: string): Promise<any> {
    const requestId = uuidv4();
    const payload = { question, request_id: requestId };

    this.redisPub
      .publish("query_requests", JSON.stringify(payload))
      .then(() => {
        console.log("Published query request:", payload.request_id);
      })
      .catch((error) => {
        console.error("Failed to publish query request:", error);
      });

    return new Promise((resolve, reject) => {
      const handler = (channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.request_id === requestId) {
            this.redisSub.removeListener("message", handler);
            resolve(data);
          }
        } catch (parseError) {
          console.error(
            "Failed to parse Redis query message:",
            parseError,
            "Message:",
            message
          );
        }
      };

      this.redisSub.on("message", handler);
      this.redisSub
        .subscribe("query_responses")
        .then(() => {
          console.log("Subscribed to query_responses");
        })
        .catch((subscribeError) => {
          console.error(
            "Failed to subscribe to query_responses:",
            subscribeError
          );
          this.redisSub.removeListener("message", handler);
          reject(
            new Error(`Query subscription failed: ${subscribeError.message}`)
          );
        });

      setTimeout(() => {
        this.redisSub.removeListener("message", handler);
        reject(new Error("Timeout waiting for query response"));
      }, 10000);
    });
  }
}
