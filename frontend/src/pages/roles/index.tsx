import { AuthenticatedLayout } from "@/layouts"
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react"
import { RoleIcon } from "./role-icon"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Main } from "@/components/layout"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useNavigate } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from "@/lib/auth"
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/data-table"
import { AccessControlTabs } from "@/pages/users/access-control-tabs"

interface Role {
  id: number
  name: string
  guard_name: string
  permissions: { id: number; name: string }[]
  users_count: number
  created_at: string
  updated_at: string
}

interface RolesPageProps extends PageProps {
  roles: {
    data: Role[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
  filters: {
    search?: string
  }
}

export default function Roles({ roles, filters: initialFilters = {} }: RolesPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search || "")
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null })
  const { t } = useI18n()
  const fullAccessRoles = useAuthStore(state => state.roles)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    navigate(value ? `/admin/roles?search=${encodeURIComponent(value)}` : '/admin/roles', { replace: true })
  }

  const handleDelete = (role: Role) => {
    if (fullAccessRoles.includes(role.name)) {
      toast.error(t('superadmin_cannot_delete'))
      return
    }
    setConfirmDelete({ open: true, role })
  }

  const confirmDeleteRole = () => {
    if (!confirmDelete.role) return
    const role = confirmDelete.role
    setConfirmDelete({ open: false, role: null })
    axios.delete(`/api/v1/roles/${role.id}`)
      .then(() => {
        toast.success(t('role_has_been_deleted', { name: role.name }))
        queryClient.invalidateQueries({ queryKey: ['/api/v1/roles'] })
      })
      .catch(() => toast.error(t('something_went_wrong')))
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(Object.entries({ ...initialFilters, page: String(page) }).map(([key, value]) => [key, String(value)]))
    navigate(`/admin/roles?${params}`, { replace: true })
  }

  const handlePerPageChange = (value: string) => {
    const params = new URLSearchParams(Object.entries({ ...initialFilters, page: '1', per_page: value }).map(([key, value]) => [key, String(value)]))
    navigate(`/admin/roles?${params}`, { replace: true })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <AuthenticatedLayout title={t('roles')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <AccessControlTabs />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('roles')}</h2>
              <p className="text-muted-foreground">
                {t('manage_roles')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder={t('search_roles')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button
                size="sm"
                className="h-9 gap-1"
                onClick={() => navigate('/admin/roles/create')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t('add_role')}
                </span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('all_roles')}</CardTitle>
              <CardDescription>
                {t('list_of_all_roles')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('permissions')}</TableHead>
                    <TableHead>{t('users')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('created_label')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('actions')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!roles.data || roles.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t('no_roles_found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.data.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <RoleIcon name={role.name} />
                            <span>{role.name}</span>
                            {fullAccessRoles.includes(role.name) && (
                              <Badge variant="secondary" className="text-xs">{t('system')}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission.id} variant="outline" className="text-xs">
                                {permission.name}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                {t('more_permissions', { count: role.permissions.length - 3 })}
                              </Badge>
                            )}
                            {role.permissions.length === 0 && (
                              <span className="text-sm text-muted-foreground">{t('no_permissions')}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t('users_count_label', { count: role.users_count })}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(role.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('toggle_menu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('edit')}
                              </DropdownMenuItem>
                              {!fullAccessRoles.includes(role.name) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(role)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <DataTablePagination
              currentPage={roles.meta.current_page}
              lastPage={roles.meta.last_page}
              perPage={roles.meta.per_page}
              total={roles.meta.total}
              selectedCount={0}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </Card>
        </div>
      </Main>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}
        title={t('delete_role')}
        desc={t('are_you_sure_delete_role', { name: confirmDelete.role?.name ?? '' })}
        confirmText={t('delete')}
        destructive
        handleConfirm={confirmDeleteRole}
      />
    </AuthenticatedLayout>
  )
}
