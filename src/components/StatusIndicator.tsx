import { motion } from 'framer-motion'
import { DomainStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: DomainStatus['status']
  className?: string
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-success',
      glow: 'shadow-[0_0_8px_rgba(76,175,80,0.6)]',
    },
    offline: {
      color: 'bg-destructive',
      glow: 'shadow-[0_0_8px_rgba(244,67,54,0.6)]',
    },
    checking: {
      color: 'bg-muted-foreground',
      glow: 'shadow-[0_0_8px_rgba(158,158,158,0.4)]',
    },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          config.color,
          config.glow,
          status === 'checking' && 'animate-pulse'
        )}
      />
    </motion.div>
  )
}
