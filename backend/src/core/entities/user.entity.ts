export class User {
  id?: string;
  name: string;
  email: string;
  username: string;
  document?: string;
  phoneNumber?: string;
  password: string;
  active: boolean;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  lastLogin?: Date;
}
