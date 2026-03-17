import { UsersService } from './users.service';

describe('UsersService.updateProfile', () => {
  const usersRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  const service = new UsersService(usersRepository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates basic fields and profileData values', async () => {
    const user = {
      id: 'u1',
      firstName: 'Old',
      lastName: 'Name',
      profileData: {},
    };
    usersRepository.findOneBy.mockResolvedValue(user);
    usersRepository.save.mockImplementation(async (u: any) => u);

    const result = await service.updateProfile('u1', {
      firstName: 'New',
      lastName: 'Name',
      occupation: 'Engineer',
      monthlyIncome: '3500',
      maxBudget: '1200',
      minRooms: '2.5',
      balcony: true,
    } as any);

    expect(result.firstName).toBe('New');
    expect(result.profileData.occupation).toBe('Engineer');
    expect(result.profileData.monthlyIncome).toBe('3500');
    expect(result.profileData.maxBudget).toBe(1200);
    expect(result.profileData.minRooms).toBe(2.5);
    expect(result.profileData.balcony).toBe(true);
  });
});
