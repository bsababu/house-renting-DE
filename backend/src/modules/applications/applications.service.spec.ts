import { ApplicationsService } from './applications.service';
import { ApplicationStatus, ApplicationMethod } from './application.entity';

describe('ApplicationsService', () => {
  const applicationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const service = new ApplicationsService(applicationRepository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new application with default status', async () => {
    applicationRepository.create.mockImplementation((data: any) => data);
    applicationRepository.save.mockImplementation(async (data: any) => data);

    const app = await service.create({
      userId: 'u1',
      listingId: 'l1',
      letterContent: 'hello',
      method: ApplicationMethod.EMAIL,
    });

    expect(app.status).toBe(ApplicationStatus.GENERATED);
    expect(applicationRepository.save).toHaveBeenCalled();
  });

  it('sets sentAt when status is SENT', async () => {
    const existing = {
      id: 'a1',
      userId: 'u1',
      status: ApplicationStatus.GENERATED,
    };
    applicationRepository.findOne.mockResolvedValue(existing);
    applicationRepository.save.mockImplementation(async (data: any) => data);

    const updated = await service.updateStatus('a1', 'u1', ApplicationStatus.SENT);
    expect(updated.status).toBe(ApplicationStatus.SENT);
    expect(updated.sentAt).toBeInstanceOf(Date);
  });
});
