import { memo } from 'react'
import { Domain, DomainStatus, DomainGroup } from '@/lib/types'
import { DomainCard } from './DomainCard'

interface OptimizedDomainListProps {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  groups?: DomainGroup[]
  onDelete?: (id: string) => void
  selectedDomains?: Set<string>
  onSelect?: (id: string, selected: boolean) => void
  showCheckbox?: boolean
  simpleMode?: boolean
}

const DomainCardMemo = memo(DomainCard, (prev, next) => {
  return (
    prev.domain.id === next.domain.id &&
    prev.status.status === next.status.status &&
    prev.status.ipAddress === next.status.ipAddress &&
    prev.status.dnsResolvable === next.status.dnsResolvable &&
    prev.isSelected === next.isSelected &&
    prev.group?.id === next.group?.id &&
    prev.showCheckbox === next.showCheckbox &&
    prev.simpleMode === next.simpleMode
  )
})

DomainCardMemo.displayName = 'DomainCardMemo'

export const OptimizedDomainList = memo(({
  domains,
  statuses,
  groups,
  onDelete,
  selectedDomains,
  onSelect,
  showCheckbox = false,
  simpleMode = false,
}: OptimizedDomainListProps) => {
  return (
    <div className="space-y-2">
      {domains.map(domain => {
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
            group={group}
            isSelected={selectedDomains?.has(domain.id) || false}
            onSelect={onSelect || (() => {})}
            showCheckbox={showCheckbox}
            simpleMode={simpleMode}
          />
        )
      })}
    </div>
  )
})

OptimizedDomainList.displayName = 'OptimizedDomainList'
