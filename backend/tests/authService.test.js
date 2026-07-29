process.env.JWT_SECRET = 'test-secret';
const { AuthService } = require('../src/services/AuthService');

function buildFakeUserRepo(seedUsers = []) {
  const users = [...seedUsers];
  return {
    findByEmail: jest.fn(async (email) => users.find((u) => u.email === email) || null),
    create: jest.fn(async (data) => {
      const user = { id: users.length + 1, ...data, password_hash: data.passwordHash };
      users.push(user);
      return user;
    }),
  };
}

describe('AuthService.register', () => {
  test('rejects an invalid role', async () => {
    const service = new AuthService(buildFakeUserRepo());
    await expect(
      service.register({ name: 'A', email: 'a@a.com', password: 'pw123456', role: 'admin' })
    ).rejects.toThrow(/Role must be one of/);
  });

  test('rejects duplicate email registration', async () => {
    const repo = buildFakeUserRepo([
      { id: 1, email: 'taken@medibook.com', password_hash: 'x', role: 'patient' },
    ]);
    const service = new AuthService(repo);
    await expect(
      service.register({
        name: 'B',
        email: 'taken@medibook.com',
        password: 'pw123456',
        role: 'patient',
      })
    ).rejects.toThrow('An account with that email already exists.');
  });

  test('successfully registers a new patient', async () => {
    const repo = buildFakeUserRepo();
    const service = new AuthService(repo);
    const user = await service.register({
      name: 'Jane',
      email: 'jane@medibook.com',
      password: 'pw123456',
      role: 'patient',
    });
    expect(user.email).toBe('jane@medibook.com');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.login', () => {
  test('rejects a login for an unknown email', async () => {
    const service = new AuthService(buildFakeUserRepo());
    await expect(
      service.login({ email: 'nobody@medibook.com', password: 'pw123456' })
    ).rejects.toThrow('Invalid email or password.');
  });
});
