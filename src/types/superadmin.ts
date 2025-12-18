export interface Organization {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  users?: User[];
  rooms?: RoomSummary[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId?: string | null;
  organization?: Organization;
  createdAt?: string;
}

export interface RoomSummary {
  id: string;
  name?: string;
  createdAt?: string;
}

export interface CreateOrganizationPayload {
  name: string;
}

export interface UpdateOrganizationPayload {
  name: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  name: string;
  organizationId: string;
}

export interface UpdateAdminPayload {
  password?: string;
  name?: string;
  organizationId?: string;
  role?: string;
}

export interface CreateOrganizationOwnerPayload {
  email: string;
  password: string;
  name: string;
  organizationId: string;
}

export interface SystemStats {
  totalOrganizations: number;
  totalAdmins: number;
  totalUsers: number;
  // Synthetic metric for now – derived in the frontend only.
  totalMinutesUsed: number;
}


