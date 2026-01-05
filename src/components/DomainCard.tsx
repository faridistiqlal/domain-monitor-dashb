import { motion } from 'framer-motion'
import { Trash, Warning, Globe, Copy, Tag } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusIndicator } from './StatusIndicator'
import { Domain, DomainStatus, DomainGroup } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface DomainCardProps {
  domain: Domain
  status: DomainStatus
  onDelete: (id: string) => void
  group?: DomainGroup
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showCheckbox?: boolean
  simpleMode?: boolean
}

export function DomainCard({ domain, status, onDelete, group, isSelected, onSelect, showCheckbox, simpleMode }: DomainCardProps) {
  const handleCopyUrl = async (format: 'plain' | 'https' | 'http') => {
    try {
      let textToCopy = domain.url
      
      if (format === 'https') {
        textToCopy = `https://${domain.url}`
      } else if (format === 'http') {
        textToCopy = `http://${domain.url}`
      }
      
      await navigator.clipboard.writeText(textToCopy)
      toast.success('URL berhasil disalin')
    } catch (error) {
      toast.error('Gagal menyalin URL')
    }
  }

  const getStatusText = () => {
    if (status.status === 'online') return 'Online'
    if (status.status === 'offline') return 'Offline'
    if (status.status === 'dns-only') return 'DNS Only'
    return 'Checking...'
  }

  const getDetailedInfo = () => {
    const parts: string[] = []
    
    if (status.dnsResolvable !== undefined) {
      parts.push(`DNS: ${status.dnsResolvable ? '✓ Resolvable' : '✗ Not resolvable'}`)
    }
    
    if (status.ipAddress) {
      parts.push(`IP: ${status.ipAddress}`)
    }
    
    if (status.httpAccessible !== undefined) {
      parts.push(`Web Server: ${status.httpAccessible ? '✓ Accessible' : '✗ Not accessible'}`)
    }
    
    if (status.protocol) {
      parts.push(`Protocol: ${status.protocol.toUpperCase()}`)
    }
    
    if (status.responseTime !== undefined) {
      parts.push(`Response: ${status.responseTime}ms`)
    }
    
    if (status.error) {
      parts.push(`Error: ${status.error}`)
    }
    
    return parts.join('\n')
  }

  if (simpleMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`group transition-all duration-200 p-3.5 ${isSelected ? 'bg-destructive/10 border-destructive/50' : 'hover:shadow-md hover:bg-accent/5'}`}>
          <div className="flex items-center gap-3">
            {showCheckbox && (
              <div className="shrink-0 flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect?.(domain.id, checked as boolean)}
                  className="shrink-0 outline-none focus-visible:outline-none focus-visible:ring-0"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <h3 className="font-mono text-sm font-medium text-foreground truncate">
                {domain.url}
              </h3>
              {group && (
                <div 
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0"
                  style={{ backgroundColor: `${group.color}20`, color: group.color }}
                >
                  <Tag size={10} weight="fill" />
                  <span className="font-medium">{group.name}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(domain.id)}
              className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash size={16} />
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group transition-all duration-200 p-3.5 ${isSelected ? 'bg-destructive/10 border-destructive/50' : 'hover:shadow-md hover:bg-accent/5'}`}>
        <div className="flex items-center gap-3">
          {showCheckbox && (
            <div className="shrink-0 flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(domain.id, checked as boolean)}
                className="shrink-0 outline-none focus-visible:outline-none focus-visible:ring-0"
              />
            </div>
          )}
          <StatusIndicator status={status.status} className="shrink-0" />
          
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <h3 className="font-mono text-sm font-medium text-foreground truncate">
              {domain.url}
            </h3>
            {group && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0"
                    style={{ backgroundColor: `${group.color}20`, color: group.color }}
                  >
                    <Tag size={10} weight="fill" />
                    <span className="font-medium">{group.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grup: {group.name}</p>
                  {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                </TooltipContent>
              </Tooltip>
            )}
            <div className="flex items-center shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`https://${domain.url}`, '_blank', 'noopener,noreferrer')}
                    className="h-6 w-6 text-muted-foreground hover:text-accent hover:bg-accent/10"
                  >
                    <Globe size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Buka di tab baru</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyUrl('plain')}
                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Copy size={14} />
              </Button>
            </div>
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
            
            {status.protocol && status.status === 'online' && (
              <>
                <span className={`font-mono uppercase px-1.5 py-0.5 rounded ${
                  status.protocol === 'https' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {status.protocol}
                </span>
                <span className="text-border">|</span>
              </>
            )}
            
            <div className="flex items-center gap-1">
              <span className={`font-medium ${
                status.status === 'online' ? 'text-success' :
                status.status === 'dns-only' ? 'text-amber-500' :
                status.status === 'offline' ? 'text-destructive' :
                'text-muted-foreground'
              }`}>
                {getStatusText()}
              </span>
              
              {status.status === 'dns-only' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Warning size={14} className="text-amber-500" weight="fill" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[250px] whitespace-pre-line">
                      {getDetailedInfo()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <span className="text-border">|</span>
            
            {status.responseTime !== undefined ? (
              <span className="font-mono text-muted-foreground">
                {status.responseTime}ms
              </span>
            ) : status.error ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive truncate max-w-[120px] cursor-help">
                    {status.error}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[250px] whitespace-pre-line">
                    {getDetailedInfo()}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(domain.id)}
            className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash size={16} />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
