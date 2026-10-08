import { useAuthStore } from '@/lib/auth'
import { type NavGroup, type NavItem } from '@/components/layout/types'

export function usePermission() {
  const permissions = useAuthStore(state => state.permissions)
  const roles = useAuthStore(state => state.roles)

  const can = (permission: string): boolean => permissions.includes(permission)
  const canAny = (perms: string[]): boolean => perms.some(p => permissions.includes(p))
  const canAll = (perms: string[]): boolean => perms.every(p => permissions.includes(p))
  const hasRole = (role: string): boolean => roles.includes(role)
  const hasAnyRole = (roleList: string[]): boolean => roleList.some(r => roles.includes(r))
  const hasFullAccess = (): boolean => roles.includes('admin')

  const checkPermission = (permission?: string | string[]): boolean => {
    if (!permission) return true
    if (hasFullAccess()) return true
    if (Array.isArray(permission)) return permission.some(p => can(p))
    return can(permission)
  }

  const filterNavItem = (item: NavItem): NavItem | null => {
    if ('items' in item && item.items) {
      const filteredItems = item.items.filter(subItem => checkPermission(subItem.permission))
      if (filteredItems.length === 0) return null
      return { ...item, items: filteredItems }
    }
    if (!checkPermission(item.permission)) return null
    return item
  }

  const filterNavGroups = (groups: NavGroup[]): NavGroup[] =>
    groups
      .map(group => ({
        ...group,
        items: group.items.map(filterNavItem).filter((item): item is NavItem => item !== null),
      }))
      .filter(group => group.items.length > 0)

  return { can, canAny, canAll, hasRole, hasAnyRole, hasFullAccess, checkPermission, filterNavGroups, permissions, roles }
}
