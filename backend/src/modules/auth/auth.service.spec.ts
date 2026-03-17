import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const usersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };

  const service = new AuthService(usersService as any, jwtService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates user and strips passwordHash', async () => {
    const user = {
      id: 'u1',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'user',
      firstName: 'Test',
      lastName: 'User',
    };
    usersService.findOneByEmail.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await service.validateUser('test@example.com', 'password');
    expect(result).toEqual({
      id: 'u1',
      email: 'test@example.com',
      role: 'user',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('returns null for invalid credentials', async () => {
    usersService.findOneByEmail.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'user',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    const result = await service.validateUser('test@example.com', 'wrong');
    expect(result).toBeNull();
  });

  it('generates access token on login', async () => {
    const result = await service.login({ id: 'u1', email: 'a@b.com', role: 'user' });
    expect(jwtService.sign).toHaveBeenCalledWith({ email: 'a@b.com', sub: 'u1', role: 'user' });
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('registers user via UsersService', async () => {
    usersService.create.mockResolvedValue({ id: 'u1' });
    const dto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    await service.register(dto as any);

    expect(usersService.create).toHaveBeenCalledWith(
      { email: dto.email, firstName: dto.firstName, lastName: dto.lastName },
      dto.password,
    );
  });
});
