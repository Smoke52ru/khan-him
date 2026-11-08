import { z } from 'zod'

export const requestSchema = z
  .object({
    name: z.string().trim().min(1, 'Укажите имя'),
    phone: z.string().trim().min(5, 'Укажите телефон'),
    email: z.union([z.literal(''), z.string().trim().email('Некорректный email')]).optional(),
    message: z.string().trim().optional().default(''),
    source: z.enum(['list', 'quick', 'price']),
    items: z
      .array(
        z.object({
          productId: z.string().optional(),
          name: z.string().min(1),
          sku: z.string().optional(),
          quantity: z.string().optional(),
        }),
      )
      .default([]),
    privacyConsent: z
      .boolean()
      .refine((value) => value === true, 'Нужно согласие с политикой конфиденциальности'),
    pdConsent: z
      .boolean()
      .refine((value) => value === true, 'Нужно согласие на обработку персональных данных'),
    website: z.string().max(0).optional().default(''),
    formOpenedAt: z.number().int(),
  })
  .superRefine((value, ctx) => {
    const hasItems = value.items.length > 0
    const hasMessage = Boolean(value.message?.trim())
    if (!hasItems && !hasMessage) {
      ctx.addIssue({
        code: 'custom',
        message: 'Добавьте товар или опишите запрос в комментарии',
        path: ['message'],
      })
    }
  })

export type RequestInput = z.infer<typeof requestSchema>
