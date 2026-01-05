import { motion } from 'framer-motion'
import { Trash } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { Domain, DomainStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface DomainCardProps {
  domain: Domain
  status: DomainStatus
  onDelete: (id: string) => void
}

export function DomainCard({ domain, status, onDelete }: DomainCardProps) {
  const getStatusText = () => {
    switch (status.status) {
      case 'online':
        return 'Online'
      case 'offline':
        return 'Offline'
      case 'checking':
        return 'Mengecek...'
    }
  }

  const getStatusVariant = () => {
    switch (status.status) {
      case 'online':
        return 'default'
      case 'offline':
        return 'destructive'
      case 'checking':
        return 'secondary'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className="p-5 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <StatusIndicator status={status.status} className="mt-1" />
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-mono text-base font-medium text-foreground break-all">
                  {domain.url}
                </h3>
                <Badge variant={getStatusVariant()} className="shrink-0">
                  {getStatusText()}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {status.responseTime !== undefined && (
                  <span className="font-mono">
                    Response: {status.responseTime}ms
                  </span>
                )}
                {status.lastChecked && (
                  <span className="text-xs">
                    Terakhir dicek: {formatDistanceToNow(status.lastChecked, { 
                      addSuffix: true,
                      locale: localeId 
                    })}
                  </span>
                )}
                {status.error && (
                  <span className="text-xs text-destructive">
                    Error: {status.error}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(domain.id)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash size={18} />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
