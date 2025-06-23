import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from './documents/documents.module';
import ormconfig from './ormconfig';
import { PythonModule } from './python-redis/python-redis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig.options),
    DocumentsModule,
    PythonModule
  ],
})
export class AppModule {}