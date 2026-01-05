import { motion } from 'framer-motion'
import { Trash } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusIndicator } from './StatusIndicator'
import { Domain, DomainStatus } from '@/lib/types'

interface DomainCardProps {
  domain: Domain
  status: DomainStatus
  onDelete: (id: string) => void
}

export function DomainCard({ domain, status, onDelete }: DomainCardProps) {
  const getStatusText = () => {
    if (status.status === 'online') return 'Online'
    if (status.status === 'offline') return 'Offline'
    return 'Checking...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.005 }}
    >
      <Card className="p-2.5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-3">
          <StatusIndicator status={status.status} className="shrink-0" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-sm font-medium text-foreground truncate">
              {domain.url}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            {status.ipAddress && (
              <>
                <span className="font-mono text-accent">
                  {status.ipAddress}
                </span>
                <span className="text-border">|</span>
              </>
            )}
            
            <span className="font-medium text-muted-foreground">
              {getStatusText()}
            </span>
            
            <span className="text-border">|</span>
            
            {status.responseTime !== undefined ? (
              <span className="font-mono text-muted-foreground">
                {status.responseTime}ms
              </span>
            ) : status.error ? (
              <span className="text-destructive truncate max-w-[200px]">
                {status.error}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(domain.id)}
            className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash size={16} />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
