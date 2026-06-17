import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { SanitizedConfig } from 'payload'

export async function htmlToLexicalContent(
  config: SanitizedConfig,
  html: string,
): Promise<Record<string, unknown>> {
  const editorConfig = await editorConfigFactory.default({ config })

  return convertHTMLToLexical({
    editorConfig,
    html,
    JSDOM,
  }) as Record<string, unknown>
}

export function fallbackLexicalFromText(text: string): Record<string, unknown> {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const children =
    paragraphs.length > 0
      ? paragraphs.map((paragraph) => ({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          children: [
            {
              type: 'text',
              text: paragraph,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
              version: 1,
            },
          ],
        }))
      : [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr' as const,
            children: [],
          },
        ]

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}
