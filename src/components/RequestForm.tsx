'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { submitRequest, type SubmitRequestState } from '@/app/actions/submitRequest'
import { clearRequestList } from '@/lib/requestList'
import { getSiteSettingsPhone } from './requestFormShared'

type Item = {
  productId?: string
  name: string
  sku?: string
  quantity?: string
}

type Props = {
  source: 'list' | 'quick' | 'price'
  items?: Item[]
  phoneFallback?: string
  onSuccess?: () => void
}

export function RequestForm({ source, items = [], phoneFallback, onSuccess }: Props) {
  const [openedAt] = useState(() => Date.now())
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<SubmitRequestState | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [pdConsent, setPdConsent] = useState(false)
  const [website, setWebsite] = useState('')

  if (state?.ok) {
    return (
      <div className="rounded-md bg-teal-50 p-4 text-teal-950">
        <p className="font-medium">{state.message}</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await submitRequest({
            name,
            phone,
            email,
            message,
            source,
            items,
            privacyConsent,
            pdConsent,
            website,
            formOpenedAt: openedAt,
          })
          setState(result)
          if (result.ok) {
            onSuccess?.()
            if (source === 'list') clearRequestList()
          }
        })
      }}
    >
      <div>
        <label htmlFor="request-name" className="block text-sm font-medium">
          Имя *
        </label>
        <input
          id="request-name"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-phone" className="block text-sm font-medium">
          Телефон *
        </label>
        <input
          id="request-phone"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {state?.fieldErrors?.phone && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.phone}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="request-email"
          type="email"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-message" className="block text-sm font-medium">
          Комментарий
        </label>
        <textarea
          id="request-message"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Адрес доставки, объём и фасовка"
        />
        {state?.fieldErrors?.message && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.message}</p>
        )}
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Согласен(на) с{' '}
          <Link href="/privacy" target="_blank" className="underline">
            политикой конфиденциальности
          </Link>
        </span>
      </label>
      {state?.fieldErrors?.privacyConsent && (
        <p className="text-sm text-red-700">{state.fieldErrors.privacyConsent}</p>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={pdConsent}
          onChange={(e) => setPdConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Согласен(на) на обработку персональных данных. С{' '}
          <Link href="/pd-consent" target="_blank" className="underline">
            согласием
          </Link>{' '}
          ознакомлен(а).
        </span>
      </label>
      {state?.fieldErrors?.pdConsent && (
        <p className="text-sm text-red-700">{state.fieldErrors.pdConsent}</p>
      )}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      {state?.message && !state.ok && (
        <p className="text-sm text-red-700">
          {state.message}
          {phoneFallback || getSiteSettingsPhone()
            ? ` Телефон: ${phoneFallback || getSiteSettingsPhone()}`
            : ''}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Отправка…' : 'Отправить заявку'}
      </button>
    </form>
  )
}
