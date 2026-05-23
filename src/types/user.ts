import type { UserRole } from '@/types/auth'

export interface ManagedUser {
  id: number
  username: string
  email: string
  role: UserRole
  is_active: boolean
  total_cost: string
  monthly_cost: string
  run_count: number
}

export interface UserRoleUpdate {
  role: UserRole
}

export interface UserRoleUpdateResponse {
  username: string
  email: string
  role: UserRole
}
