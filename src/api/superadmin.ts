import api from "@/api/axiosInstance";
import type {
  CreateAdminPayload,
  CreateOrganizationOwnerPayload,
  CreateOrganizationPayload,
  Organization,
  SystemStats,
  UpdateAdminPayload,
  UpdateOrganizationPayload,
  User,
} from "@/types/superadmin";
import { getSyntheticMinutesForOrganization } from "@/lib/analytics";

// Organizations

export async function fetchOrganizations(
  search?: string,
): Promise<Organization[]> {
  const response = await api.get<Organization[]>("/superadmin/organizations", {
    params: search ? { name: search } : undefined,
  });
  return response.data;
}

export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<Organization> {
  const response = await api.post<Organization>(
    "/superadmin/organizations",
    payload,
  );
  return response.data;
}

export async function updateOrganization(
  id: string,
  payload: UpdateOrganizationPayload,
): Promise<Organization> {
  const response = await api.patch<Organization>(
    `/superadmin/organizations/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteOrganization(id: string): Promise<void> {
  await api.delete(`/superadmin/organizations/${id}`);
}

// Admins (Users)

export async function fetchAdmins(): Promise<User[]> {
  const response = await api.get<User[]>("/superadmin/admins");
  return response.data;
}

export async function createAdmin(
  payload: CreateAdminPayload,
): Promise<User> {
  const response = await api.post<User>("/superadmin/admins", payload);
  return response.data;
}

export async function updateAdmin(
  id: string,
  payload: UpdateAdminPayload,
): Promise<User> {
  const response = await api.patch<User>(`/superadmin/admins/${id}`, payload);
  return response.data;
}

export async function deleteAdmin(id: string): Promise<void> {
  await api.delete(`/superadmin/admins/${id}`);
}

// Organization Owners

export async function createOrganizationOwner(
  payload: CreateOrganizationOwnerPayload,
): Promise<User> {
  const response = await api.post<User>("/superadmin/owners", payload);
  return response.data;
}

// Derived system stats using existing endpoints

export async function fetchSystemStats(): Promise<SystemStats> {
  const [organizations, admins] = await Promise.all([
    fetchOrganizations(),
    fetchAdmins(),
  ]);

  const totalOrganizations = organizations.length;
  const totalAdmins = admins.length;
  const totalUsers =
    organizations.reduce((sum, org) => sum + (org.users?.length ?? 0), 0) ||
    totalAdmins;

  const totalMinutesUsed = organizations.reduce(
    (sum, org) => sum + getSyntheticMinutesForOrganization(org),
    0,
  );

  return {
    totalOrganizations,
    totalAdmins,
    totalUsers,
    totalMinutesUsed,
  };
}


