import bcrypt from 'bcryptjs';
import { UserRepository } from '../infrastructure/UserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class RegisterUseCase {
  constructor(private repo = new UserRepository()) {}
  async execute(email: string, password: string, name: string, businessId?: string) {
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new AppError(409, 'EMAIL_EXISTS', 'El email ya está registrado');
    const hash = await bcrypt.hash(password, 10);
    const user = await this.repo.create({ email, passwordHash: hash, name, businessId });
    return user;
  }
}
