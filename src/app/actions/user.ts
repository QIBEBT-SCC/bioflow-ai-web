import { clientFetch } from '@/lib/api-client'
import type {
  ManagedUser,
  ManagedUserCreate,
  UserPasswordReset,
  UserRoleUpdate,
  UserRoleUpdateResponse,
  UserStatusUpdate,
} from '@/types/user'

export async function getUsers(): Promise<ManagedUser[]> {
  return await clientFetch<ManagedUser[]>('/user')
}

export async function updateUserRole(
  userId: number,
  data: UserRoleUpdate,
): Promise<UserRoleUpdateResponse> {
  return await clientFetch<UserRoleUpdateResponse>(`/user/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createUser(data: ManagedUserCreate) {
  return await clientFetch<UserRoleUpdateResponse>('/user', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUserStatus(userId: number, data: UserStatusUpdate) {
  return await clientFetch<UserRoleUpdateResponse>(`/user/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function resetUserPassword(
  userId: number,
  data: UserPasswordReset,
) {
  await clientFetch(`/user/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
