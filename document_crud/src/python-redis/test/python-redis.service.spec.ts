import { PythonRedisService } from '../python-redis.service';
import { v4 as uuidv4 } from 'uuid';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    on: jest.fn(),
    subscribe: jest.fn(),
    removeListener: jest.fn(),
  }));
});
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('PythonRedisService', () => {
  let service: PythonRedisService;
  let redisPub: any;
  let redisSub: any;

  beforeEach(() => {
    service = new PythonRedisService();
    redisPub = (service as any).redisPub;
    redisSub = (service as any).redisSub;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should publish ingest request and resolve on matching response', async () => {
    const publishMock = redisPub.publish as jest.Mock;
    const onMock = redisSub.on as jest.Mock;
    const subscribeMock = redisSub.subscribe as jest.Mock;

    let handler: any;
    onMock.mockImplementation((event, cb) => {
      if (event === 'message') handler = cb;
    });

    const promise = service.ingestFile('file.txt', Buffer.from('abc'));

    // Wait for the handler to be set in the next tick
    await Promise.resolve();

    if (handler) {
      handler('ingest_responses', JSON.stringify({ request_id: 'mock-uuid', result: 'ok' }));
    } else {
      throw new Error('Handler was not set');
    }

    await expect(promise).resolves.toEqual({ request_id: 'mock-uuid', result: 'ok' });
    expect(publishMock).toHaveBeenCalled();
    expect(subscribeMock).toHaveBeenCalledWith('ingest_responses');
  });

  it('should publish query request and resolve on matching response', async () => {
    const publishMock = redisPub.publish as jest.Mock;
    const onMock = redisSub.on as jest.Mock;
    const subscribeMock = redisSub.subscribe as jest.Mock;

    let handler: any;
    onMock.mockImplementation((event, cb) => {
      if (event === 'message') handler = cb;
    });

    const promise = service.query('What is this?');

    // Wait for the handler to be set in the next tick
    await Promise.resolve();

    if (handler) {
      handler('query_responses', JSON.stringify({ request_id: 'mock-uuid', answer: '42' }));
    } else {
      throw new Error('Handler was not set');
    }

    await expect(promise).resolves.toEqual({ request_id: 'mock-uuid', answer: '42' });
    expect(publishMock).toHaveBeenCalled();
    expect(subscribeMock).toHaveBeenCalledWith('query_responses');
  });

  it('should timeout if no response is received', async () => {
    jest.useFakeTimers();
    const promise = service.query('timeout test');
    // Wait for the handler to be set
    await Promise.resolve();
    jest.advanceTimersByTime(10001);
    // Flush microtasks
    await Promise.resolve();
    await expect(promise).rejects.toThrow('Timeout waiting for query response');
    jest.useRealTimers();
  });
});