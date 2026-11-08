import type { GlobalConfig } from 'payload'

function contentPage(slug: string, label: string): GlobalConfig {
  return {
    slug,
    label,
    access: {
      read: () => true,
    },
    fields: [
      {
        name: 'isDraft',
        type: 'checkbox',
        label: 'Черновик',
        defaultValue: true,
        admin: {
          description: 'Пока включено, на сайте показывается пометка «Черновик».',
        },
      },
      {
        name: 'body',
        type: 'richText',
        label: 'Текст',
      },
    ],
  }
}

export const AboutPage = contentPage('about-page', 'О компании')
export const PrivacyPolicy = contentPage('privacy-policy', 'Политика конфиденциальности')
export const PdConsent = contentPage('pd-consent', 'Согласие на обработку ПДн')
