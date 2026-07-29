const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

const VALID_ROLES = ['patient', 'doctor', 'receptionist'];

class AuthService {
  constructor(repo = userRepository) {
    this.userRepository = repo; // injected -> easy to mock in tests
  }

  async register({ name, email, password, role, specialty }) {
    if (!VALID_ROLES.includes(role)) {
      throw new AppError(`Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
    }
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('An account with that email already exists.', 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({
      name,
      email,
      passwordHash,
      role,
      specialty: role === 'doctor' ? specialty : null,
    });
    return user;
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService; // exported for unit testing with a mock repo
