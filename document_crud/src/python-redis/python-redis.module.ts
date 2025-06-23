import { Module } from '@nestjs/common';
import { PythonController } from './python-redis.controller';
import { PythonRedisService } from './python-redis.service';

@Module({
  controllers: [PythonController],
  providers: [PythonRedisService],
})
export class PythonModule {}