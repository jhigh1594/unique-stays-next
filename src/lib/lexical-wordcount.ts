/**
 * Walks a Payload Lexical JSON tree, concatenates every text-node string, and
 * returns a word count.
 *
 * Used for BlogPosting.wordCount, which is DERIVED from the real article body —
 * never a hardcoded or invented number.
 */

type LexicalNode = { text?: string; children?: LexicalNode[] } | undefined

function collectText(node: LexicalNode, out: string[]): void {
  if (!node || typeof node !== 'object') return
  if (typeof node.text === 'string' && node.text.length > 0) out.push(node.text)
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectText(child, out)
  }
}

/** Flatten a Lexical document (`{ root: { children: [...] } }`) to plain text. */
export function lexicalPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: LexicalNode }).root
  const parts: string[] = []
  collectText(root, parts)
  return parts.join(' ')
}

/** Word count for a Lexical document. Returns 0 when content is empty/absent. */
export function countWordsInLexical(content: unknown): number {
  const text = lexicalPlainText(content)
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}
