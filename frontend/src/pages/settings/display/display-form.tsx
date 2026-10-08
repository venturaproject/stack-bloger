import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useI18n } from '@/i18n/context'
import { router } from '@/lib/router'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { axios } from '@/lib/axios'

export function DisplayForm() {
  const { t } = useI18n()

  const items = [
    { id: 'recents',      label: t('recents') },
    { id: 'home',         label: t('home') },
    { id: 'applications', label: t('applications') },
    { id: 'desktop',      label: t('desktop') },
    { id: 'downloads',    label: t('downloads') },
    { id: 'documents',    label: t('documents') },
  ] as const

  const displayFormSchema = z.object({
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: t('select_at_least_one_item'),
    }),
  })

  type DisplayFormValues = z.infer<typeof displayFormSchema>

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      items: ['recents', 'home'],
    },
  })

  useEffect(() => {
    axios.get('/api/v1/settings').then(({ data }) => {
      form.reset({ items: data.data.displayItems })
    }).catch(() => undefined)
  }, [form])

  function onSubmit(data: DisplayFormValues) {
    router.put('/api/v1/settings/display', data, {
      onSuccess: () => {
        toast.success(t('display_settings_saved'))
      },
      onError: () => {
        toast.error(t('something_went_wrong'))
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>{t('sidebar')}</FormLabel>
                <FormDescription>
                  {t('sidebar_description')}
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name='items'
                  render={({ field }) => (
                    <FormItem
                      key={item.id}
                      className='flex flex-row items-start space-x-3 space-y-0'
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(item.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, item.id])
                              : field.onChange(field.value?.filter((value) => value !== item.id))
                          }}
                        />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        {item.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>{t('update_display')}</Button>
      </form>
    </Form>
  )
}
