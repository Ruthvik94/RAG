import { Module } from "@nestjs/common";
import { PythonModule } from "./python-redis/python-upstash.module";

@Module({
  imports: [PythonModule],
})
export class AppModule {}
