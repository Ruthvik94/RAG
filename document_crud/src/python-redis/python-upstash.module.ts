import { Module } from "@nestjs/common";
import { PythonUpstashController } from "./python-upstash.controller";
import { PythonUpstashService } from "./python-upstash.service";

@Module({
  controllers: [PythonUpstashController],
  providers: [PythonUpstashService],
})
export class PythonModule {}
