import { HTMLAttributes, useState } from 'react'
import { Link } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { useAuthStore } from '@/lib/auth'
import { pathFor } from '@/lib/app-routes'
import { navigateTo } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import InputError from '@/components/InputError'
import { getApiErrorResponse } from '@/lib/api-error'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement> & {
  status?: string
  canResetPassword?: boolean
}

export function UserAuthForm({ className, status, canResetPassword = true, ...props }: UserAuthFormProps) {
  const [data, setDataState] = useState({ login: '', password: '', remember: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)

  const setData = <K extends keyof typeof data>(key: K, value: typeof data[K]) => setDataState(prev => ({ ...prev, [key]: value }))

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProcessing(true)
    setErrors({})
    try {
      const res = await axios.post('/api/v1/auth/login', data)
      const resData = res.data
      if (resData?.user) {
        // The server set the access_token httpOnly cookie — just store user data in memory.
        useAuthStore.getState().setAuth(
          { id: resData.user.id, name: resData.user.name, email: resData.user.email, role: resData.user.roles?.[0] ?? 'user', avatar: resData.user.avatar ?? null, username: null },
          resData.user.permissions ?? [],
          resData.user.roles ?? [],
        )
        navigateTo(pathFor('admin.dashboard'))
      }
    } catch (err: unknown) {
      const response = getApiErrorResponse(err)
      const errData = response?.data
      if (response?.status === 422 && errData) {
        const normalized: Record<string, string> = {}
        for (const [k, v] of Object.entries(errData)) {
          normalized[k] = Array.isArray(v) ? (v as string[])[0] : (v as string)
        }
        setErrors(normalized)
      } else {
        const message = errData?.message ?? errData?.error
        setErrors({ login: typeof message === 'string' ? message : 'Credenciales incorrectas' })
      }
    } finally {
      setProcessing(false)
      setData('password', '')
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      {status && <div className='text-sm font-medium text-green-600'>{status}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className='grid gap-2'>
          <div className='space-y-1'>
            <Label htmlFor='login'>Email o usuario</Label>
            <Input
              id='login'
              type='text'
              placeholder='nombre.apellido o email@ejemplo.com'
              autoComplete='username'
              value={data.login}
              onChange={(e) => setData('login', e.target.value)}
            />
            <InputError message={errors.login} className='mt-2' />
          </div>

          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='password'>Password</Label>
              {canResetPassword && (
                <Link
                  to='/forgot-password'
                  className='text-sm font-medium text-muted-foreground hover:opacity-75'
                  tabIndex={1}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <PasswordInput
              id='password'
              placeholder='********'
              autoComplete='current-password'
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
            />
            <InputError message={errors.password} className='mt-2' />
          </div>

          <div className='flex flex-row items-center space-x-2 space-y-0 mt-2'>
            <Checkbox
              id='remember'
              checked={data.remember}
              onCheckedChange={(checked) => setData('remember', !!checked)}
            />
            <label htmlFor='remember' className='text-sm font-normal text-muted-foreground'>
              Recordarme
            </label>
          </div>

          <Button className='mt-4' disabled={processing}>
            {processing ? 'Accediendo...' : 'Entrar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
