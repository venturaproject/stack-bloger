import { AuthenticatedLayout } from "@/layouts"
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  Key,
} from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Main } from "@/components/layout"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useNavigate } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/data-table"
import { AccessControlTabs } from "@/pages/users/access-control-tabs"

interface Permission {
  id: number
  name: string
  guard_name: string
  roles_count: number
  created_at: string
  updated_at: string
}

interface PermissionsPageProps extends PageProps {
  permissions: {
    data: Permission[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
  groups: string[]
  filters: {
    search?: string
    group?: string
  }
}

export default function Permissions({ permissions, groups, filters: initialFilters = {} }: PermissionsPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search || "")
  const [selectedGroup, setSelectedGroup] = useState(initialFilters?.group || "")
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; permission: Permission | null }>({ open: false, permission: null })
  const { t } = useI18n()

  const buildUrl = (params: Record<string, unknown>) => {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    return '/admin/permissions' + (entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '')
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    navigate(buildUrl({ search: value, group: selectedGroup }), { replace: true })
  }

  const handleGroupFilter = (value: string) => {
    const group = value === 'all' ? '' : value
    setSelectedGroup(group)
    navigate(buildUrl({ search: searchTerm, group }), { replace: true })
  }

  const handleDelete = (permission: Permission) => {
    setConfirmDelete({ open: true, permission })
  }

  const confirmDeletePermission = () => {
    if (!confirmDelete.permission) return
    const permission = confirmDelete.permission
    setConfirmDelete({ open: false, permission: null })
    axios.delete(`/api/v1/permissions/${permission.id}`)
      .then(() => {
        toast.success(t('permission_has_been_deleted', { name: permission.name }))
        queryClient.invalidateQueries({ queryKey: ['/api/v1/permissions'] })
      })
      .catch(() => toast.error(t('something_went_wrong')))
  }

  const handlePageChange = (page: number) => {
    navigate(buildUrl({ ...initialFilters, page }), { replace: true })
  }

  const handlePerPageChange = (value: string) => {
    navigate(buildUrl({ ...initialFilters, page: 1, per_page: value }), { replace: true })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPermissionGroup = (name: string) => {
    return name.split('.')[0] || 'other'
  }

  const getPermissionAction = (name: string) => {
    return name.split('.')[1] || name
  }

  return (
    <AuthenticatedLayout title={t('permissions')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <AccessControlTabs />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('permissions')}</h2>
              <p className="text-muted-foreground">
                {t('manage_permissions')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder={t('search_permissions')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={selectedGroup || 'all'} onValueChange={handleGroupFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('filter_by_group')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_groups')}</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group} className="capitalize">
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 gap-1"
                onClick={() => navigate('/admin/permissions/create')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t('add_permission')}
                </span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('all_permissions')}</CardTitle>
              <CardDescription>
                {t('list_of_all_permissions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('group')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                    <TableHead>{t('assigned_to_roles')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('created_label')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('actions')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!permissions.data || permissions.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t('no_permissions_found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.data.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{permission.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getPermissionGroup(permission.name)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">
                            {getPermissionAction(permission.name)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t('roles_count_label', { count: permission.roles_count })}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(permission.created_at)}
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
                                onClick={() => navigate(`/admin/permissions/${permission.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(permission)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete')}
                              </DropdownMenuItem>
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
              currentPage={permissions.meta.current_page}
              lastPage={permissions.meta.last_page}
              perPage={permissions.meta.per_page}
              total={permissions.meta.total}
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
        title={t('delete_permission')}
        desc={t('are_you_sure_delete_permission', { name: confirmDelete.permission?.name ?? '' })}
        confirmText={t('delete')}
        destructive
        handleConfirm={confirmDeletePermission}
      />
    </AuthenticatedLayout>
  )
}
