import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Document } from './documents/documents.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'rag_user',
  password: process.env.DB_PASS || '12345',
  database: process.env.DB_NAME || 'documents_db',
  // entities: [__dirname + '/documents/**/*.entity{.ts,.js}'],
  entities: [Document],
  synchronize: false, // Disable in production!
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});