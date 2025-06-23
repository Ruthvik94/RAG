import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PythonRedisService {
  private redisPub = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  }); // default PORT 6379
  private redisSub = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  }); // default PORT 6379

  async ingestFile(filename: string, fileBuffer: Buffer): Promise<any> {
    const requestId = uuidv4();
    const fileContent = fileBuffer.toString('base64');
    const payload = { filename, file_content: fileContent, request_id: requestId };

    await this.redisPub.publish('ingest_requests', JSON.stringify(payload));
    console.log('Published ingest request:', payload.filename, payload.request_id);

    return new Promise((resolve, reject) => {
      const handler = (channel: string, message: string) => {
        const data = JSON.parse(message);
        if (data.request_id === requestId) {
          this.redisSub.removeListener('message', handler);
          resolve(data);
        }
      };
      this.redisSub.on('message', handler);
      this.redisSub.subscribe('ingest_responses');
      // Optional: timeout
      setTimeout(() => {
        this.redisSub.removeListener('message', handler);
        reject(new Error('Timeout waiting for ingest response'));
      }, 10000);
    });
  }

  async query(question: string): Promise<any> {
    const requestId = uuidv4();
    const payload = { question, request_id: requestId };

    await this.redisPub.publish('query_requests', JSON.stringify(payload));

    return new Promise((resolve, reject) => {
      const handler = (channel: string, message: string) => {
        const data = JSON.parse(message);
        if (data.request_id === requestId) {
          this.redisSub.removeListener('message', handler);
          resolve(data);
        }
      };
      this.redisSub.on('message', handler);
      this.redisSub.subscribe('query_responses');
      console.log('Subscribed to ingest_responses');
      setTimeout(() => {
        this.redisSub.removeListener('message', handler);
        reject(new Error('Timeout waiting for query response'));
      }, 10000);
    });
  }
}