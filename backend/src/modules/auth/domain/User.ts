export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  businessId: string | null;
  isActive: boolean;
}
