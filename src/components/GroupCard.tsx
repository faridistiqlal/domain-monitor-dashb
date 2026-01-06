import { useState } from 'react'
import { Folder, DotsThree, Trash, PencilSimple, Globe, DownloadSimple } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DomainGroup } from '@/lib/types'

interface GroupCardProps {
  group: DomainGroup
  domainCount: number
  onlineCount: number
  offlineCount: number
  dnsOnlyCount: number
  onEdit?: (group: DomainGroup) => void
  onDelete?: (groupId: string) => void
  onViewDomains: (groupId: string) => void
  onExport: (groupId: string) => void
  disableExport?: boolean
}

export function GroupCard({
  group,
  domainCount,
  onlineCount,
  offlineCount,
  dnsOnlyCount,
  onEdit,
  onDelete,
  onViewDomains,
  onExport,
  disableExport = false,
}: GroupCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    setIsDeleting(true)
    onDelete(group.id)
  }

  return (
    <Card 
      className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
      style={{ borderLeft: `4px solid ${group.color}` }}
      onClick={() => onViewDomains(group.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${group.color}20` }}
          >
            <Folder size={20} weight="duotone" style={{ color: group.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-foreground">{group.name}</h3>
            {group.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {group.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground">{domainCount} domain</span>
              </div>
              {domainCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'oklch(0.70 0.22 145)' }}>{onlineCount}</span>
                    {dnsOnlyCount > 0 && <span style={{ color: 'rgb(245, 158, 11)' }}>{dnsOnlyCount}</span>}
                    <span className="text-destructive">{offlineCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <DotsThree size={16} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation()
                onExport(group.id)
              }}
              disabled={domainCount === 0 || disableExport}
            >
              <DownloadSimple size={14} className="mr-2" />
              Export CSV
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(group)
              }}>
                <PencilSimple size={14} className="mr-2" />
                Edit Grup
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash size={14} className="mr-2" />
                Hapus Grup
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
