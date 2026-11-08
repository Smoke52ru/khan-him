export function OfferDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm text-ink-soft ${className}`}>
      Информация на сайте не является публичной офертой. Актуальные цены и наличие уточняйте у
      менеджера.
    </p>
  )
}
