import { useCallback, useState } from 'react'

export function useDomainSelection() {
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())

  const toggleDomainSelection = useCallback((id: string, selected: boolean) => {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const replaceSelection = useCallback((ids: string[]) => {
    setSelectedDomains(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedDomains(new Set())
  }, [])

  return {
    selectedDomains,
    setSelectedDomains,
    toggleDomainSelection,
    replaceSelection,
    clearSelection,
  }
}
