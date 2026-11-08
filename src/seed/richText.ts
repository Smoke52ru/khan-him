/** Минимальный Lexical JSON для однострочного абзаца. */
export function paragraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '' as const,
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              text,
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '',
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          textStyle: '',
          textFormat: 0,
        },
      ],
      direction: 'ltr' as const,
    },
  }
}
