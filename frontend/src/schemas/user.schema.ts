import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
})

export const editUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type EditUserFormValues = z.infer<typeof editUserSchema>
