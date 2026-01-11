import { UserRole } from '../constants/roles';

export interface Company {
  id: string;
  name: string;
  folderPath: string;
  folderId: string;
  createdAt: string;
  ownerEmail?: string;
  ownerAccountId?: string;
  role?: UserRole;
  members?: CompanyMember[];
}

export interface CompanyMember {
  email: string;
  accountId: string;
  role: UserRole;
  joinedAt: string;
}

