import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { Domain, DomainStatus, DomainGroup, DomainTag } from '@/lib/types'
import { DomainCard } from './DomainCard'
import { Button } from './ui/button'
import { CaretDown } from '@phosphor-icons/react'

interface OptimizedDomainListProps {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  groups?: DomainGroup[]
  tags?: DomainTag[]
  onDelete?: (id: string) => void
  onEdit?: (id: string, newUrl: string) => void
  onToggleMonitoring?: (id: string) => void
  existingUrls?: string[]
  selectedDomains?: Set<string>
  onSelect?: (id: string, selected: boolean) => void
  showCheckbox?: boolean
  simpleMode?: boolean
}

const DomainCardMemo = memo(DomainCard, (prev, next) => {
  return (
    prev.domain.id === next.domain.id &&
    prev.domain.url === next.domain.url &&
    prev.domain.notificationsEnabled === next.domain.notificationsEnabled &&
    prev.domain.enabled === next.domain.enabled &&
    prev.status.status === next.status.status &&
    prev.status.ipAddress === next.status.ipAddress &&
    prev.status.dnsResolvable === next.status.dnsResolvable &&
    prev.isSelected === next.isSelected &&
    prev.group?.id === next.group?.id &&
    prev.domain.tags?.join(',') === next.domain.tags?.join(',') &&
    prev.showCheckbox === next.showCheckbox &&
    prev.simpleMode === next.simpleMode
  )
})

DomainCardMemo.displayName = 'DomainCardMemo'

export const OptimizedDomainList = memo(({
  domains,
  statuses,
  groups,
  tags,
  onDelete,
  onEdit,
  onToggleMonitoring,
  existingUrls,
  selectedDomains,
  onSelect,
  showCheckbox = false,
  simpleMode = false,
}: OptimizedDomainListProps) => {
  const ITEMS_PER_PAGE = 50
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [domains])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < domains.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, domains.length))
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [displayCount, domains.length])

  const visibleDomains = domains.slice(0, displayCount)
  const hasMore = displayCount < domains.length

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, domains.length))
  }, [domains.length])

  return (
    <div className="space-y-2">
      {visibleDomains.map(domain => {
        const status = statuses[domain.id] || { id: domain.id, status: 'checking' as const }
        const group = domain.groupId && groups
          ? groups.find(g => g.id === domain.groupId)
          : undefined

        return (
          <DomainCardMemo
            key={domain.id}
            domain={domain}
            status={status}
            onDelete={onDelete || (() => {})}
            onEdit={onEdit}
            onToggleMonitoring={onToggleMonitoring}
            existingUrls={existingUrls}
            group={group}
            tags={tags}
            isSelected={selectedDomains?.has(domain.id) || false}
            onSelect={onSelect || (() => {})}
            showCheckbox={showCheckbox}
            simpleMode={simpleMode}
          />
        )
      })}
      
      {hasMore && (
        <div ref={loadMoreRef} className="pt-4 pb-2 flex flex-col items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Menampilkan {displayCount} dari {domains.length} domain
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            className="h-8"
          >
            <CaretDown size={14} />
            Muat {Math.min(ITEMS_PER_PAGE, domains.length - displayCount)} Lagi
          </Button>
        </div>
      )}
    </div>
  )
})

OptimizedDomainList.displayName = 'OptimizedDomainList'
