import { PythonController } from '../python-redis.controller';
import { PythonRedisService } from '../python-redis.service';
import { HttpException } from '@nestjs/common';

describe('PythonController', () => {
  let controller: PythonController;
  let service: PythonRedisService;

  beforeEach(() => {
    service = {
      ingestFile: jest.fn().mockResolvedValue({ result: 'ingested' }),
      query: jest.fn().mockResolvedValue({ answer: 'result' }),
    } as any;
    controller = new PythonController(service);
  });

  it('should call ingestFile on service', async () => {
    const file = { originalname: 'a.txt', buffer: Buffer.from('abc') } as any;
    const result = await controller.ingestFile(file);
    expect(result).toEqual({ result: 'ingested' });
    expect(service.ingestFile).toHaveBeenCalledWith('a.txt', file.buffer);
  });

  it('should throw if file is missing in ingestFile', async () => {
    await expect(controller.ingestFile(undefined as any)).rejects.toThrow(HttpException);
  });

  it('should call query on service', async () => {
    const result = await controller.queryPython('What?');
    expect(result).toEqual({ answer: 'result' });
    expect(service.query).toHaveBeenCalledWith('What?');
  });

  it('should throw if question is missing in queryPython', async () => {
    await expect(controller.queryPython(undefined as any)).rejects.toThrow(HttpException);
  });
});