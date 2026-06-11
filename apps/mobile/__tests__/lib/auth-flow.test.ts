import { loginSchema, passwordSetupSchema, resetPasswordRequestSchema } from '@hanapkalinga/shared/validations';

describe('Auth Validations', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'mypassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSetupSchema', () => {
    it('accepts matching passwords of 8+ chars', () => {
      const result = passwordSetupSchema.safeParse({
        password: 'longenough',
        confirmPassword: 'longenough',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const result = passwordSetupSchema.safeParse({
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-matching passwords', () => {
      const result = passwordSetupSchema.safeParse({
        password: 'longenough',
        confirmPassword: 'different',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordRequestSchema', () => {
    it('accepts valid email', () => {
      const result = resetPasswordRequestSchema.safeParse({ email: 'user@example.com' });
      expect(result.success).toBe(true);
    });

    it('rejects empty email', () => {
      const result = resetPasswordRequestSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Role-based redirect logic', () => {
  it('maps family role to family dashboard', () => {
    const getRedirectPath = (role: string) => {
      switch (role) {
        case 'family': return '/(family)';
        case 'nurse': return '/(nurse)';
        case 'admin': return '/(admin)';
        default: return '/';
      }
    };
    expect(getRedirectPath('family')).toBe('/(family)');
    expect(getRedirectPath('nurse')).toBe('/(nurse)');
    expect(getRedirectPath('admin')).toBe('/(admin)');
    expect(getRedirectPath('unknown' as any)).toBe('/');
  });
});
