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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.005 }}
    >
      <Card className="p-2.5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIndicator status={status.status} className="shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-medium text-foreground break-all">
                  {domain.url}
                </h3>
                {status.responseTime !== undefined && (
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {status.responseTime}ms
                  </span>
                )}
              </div>
              
              {status.error && (
                <span className="text-xs text-destructive block mt-0.5">
                  {status.error}
                </span>
              )}
            </div>
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
