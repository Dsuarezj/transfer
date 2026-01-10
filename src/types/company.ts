export interface Company {
  id: string;
  name: string;
  folderPath: string;
  folderId: string;
  createdAt: string;
  ownerEmail?: string;
  ownerAccountId?: string;
  members?: CompanyMember[];
}

export interface CompanyMember {
  email: string;
  accountId: string;
  role: 'admin' | 'employee';
  joinedAt: string;
}

