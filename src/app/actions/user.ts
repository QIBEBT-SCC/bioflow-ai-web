import { clientFetch } from '@/lib/api-client'
import type {
  ManagedUser,
  UserRoleUpdate,
  UserRoleUpdateResponse,
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
