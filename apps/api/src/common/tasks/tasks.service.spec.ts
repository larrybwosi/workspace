import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { processScheduledNotifications, processScheduledCalls, processNotificationQueue } from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/shared/server', () => ({
  processScheduledNotifications: vi.fn(),
  processScheduledCalls: vi.fn(),
  processNotificationQueue: vi.fn(),
}));

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);

    vi.clearAllMocks();
  });

  it('should call all three background processors successfully', async () => {
    await service.handleCron();

    expect(processScheduledNotifications).toHaveBeenCalledTimes(1);
    expect(processScheduledCalls).toHaveBeenCalledTimes(1);
    expect(processNotificationQueue).toHaveBeenCalledTimes(1);
  });

  it('should continue running subsequent tasks when processScheduledNotifications throws a P2021 error', async () => {
    const errorP2021 = new Error('Table does not exist');
    (errorP2021 as any).code = 'P2021';
    vi.mocked(processScheduledNotifications).mockRejectedValueOnce(errorP2021);

    await service.handleCron();

    expect(processScheduledNotifications).toHaveBeenCalledTimes(1);
    expect(processScheduledCalls).toHaveBeenCalledTimes(1);
    expect(processNotificationQueue).toHaveBeenCalledTimes(1);
  });

  it('should continue running subsequent tasks when processScheduledNotifications throws a generic error', async () => {
    const genericError = new Error('Generic database error');
    vi.mocked(processScheduledNotifications).mockRejectedValueOnce(genericError);

    await service.handleCron();

    expect(processScheduledNotifications).toHaveBeenCalledTimes(1);
    expect(processScheduledCalls).toHaveBeenCalledTimes(1);
    expect(processNotificationQueue).toHaveBeenCalledTimes(1);
  });
});
