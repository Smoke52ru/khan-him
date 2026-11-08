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
      <div className="border border-stock bg-signal-soft/40 p-5 text-ink">
        <p className="font-semibold text-stock">{state.message}</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
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
          className="field mt-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.name}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-phone" className="block text-sm font-medium">
          Телефон *
        </label>
        <input
          id="request-phone"
          className="field mt-1.5"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {state?.fieldErrors?.phone && (
          <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.phone}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="request-email"
          type="email"
          className="field mt-1.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="request-message" className="block text-sm font-medium">
          Комментарий
        </label>
        <textarea
          id="request-message"
          className="field mt-1.5"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Адрес доставки, объём и фасовка"
        />
        {state?.fieldErrors?.message && (
          <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.message}</p>
        )}
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-1 accent-signal"
        />
        <span>
          Согласен(на) с{' '}
          <Link href="/privacy" target="_blank" className="text-signal-ink">
            политикой конфиденциальности
          </Link>
        </span>
      </label>
      {state?.fieldErrors?.privacyConsent && (
        <p className="text-sm text-danger">{state.fieldErrors.privacyConsent}</p>
      )}
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={pdConsent}
          onChange={(e) => setPdConsent(e.target.checked)}
          className="mt-1 accent-signal"
        />
        <span>
          Согласен(на) на обработку персональных данных. С{' '}
          <Link href="/pd-consent" target="_blank" className="text-signal-ink">
            согласием
          </Link>{' '}
          ознакомлен(а).
        </span>
      </label>
      {state?.fieldErrors?.pdConsent && (
        <p className="text-sm text-danger">{state.fieldErrors.pdConsent}</p>
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
        <p className="text-sm text-danger">
          {state.message}
          {phoneFallback || getSiteSettingsPhone()
            ? ` Телефон: ${phoneFallback || getSiteSettingsPhone()}`
            : ''}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Отправка…' : 'Отправить заявку'}
      </button>
    </form>
  )
}
