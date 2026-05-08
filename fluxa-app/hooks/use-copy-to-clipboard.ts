import { useState } from 'react'

export function useCopyToClipboard(duration = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = async (text: string, key = 'default') => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), duration)
  }

  const isCopied = (key = 'default') => copiedKey === key

  return { copy, isCopied }
}
