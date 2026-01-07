import { motion } from 'framer-motion'
import { Trash, Warning, Globe, Copy, Tag, Bell, BellSlash, LockKey, LockKeyOpen, ShieldWarning, Lightning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { EditDomainDialog } from './EditDomainDialog'
import { Domain, DomainStatus, DomainGroup, DomainTag } from '@/lib/types'
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
  onEdit?: (id: string, newUrl: string) => void
  existingUrls?: string[]
  group?: DomainGroup
  tags?: DomainTag[]
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showCheckbox?: boolean
  simpleMode?: boolean
}

export function DomainCard({ domain, status, onDelete, onEdit, existingUrls, group, tags, isSelected, onSelect, showCheckbox, simpleMode }: DomainCardProps) {
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

  const domainTags = domain.tags?.map(tagId => tags?.find(t => t.id === tagId)).filter(Boolean) as DomainTag[] | undefined

  const getStatusText = () => {
    if (status.status === 'online') return 'Online'
    if (status.status === 'offline') return 'Offline'
    if (status.status === 'dns-only') return 'DNS Only'
    return 'Checking...'
  }

  const getResponseTimeColor = (ms?: number) => {
    if (!ms) return 'text-muted-foreground'
    if (ms < 2000) return 'text-success' // Fast - green
    if (ms < 5000) return 'text-amber-500' // Normal - orange
    return 'text-destructive' // Slow - red
  }

  const getResponseTimeLabel = (ms?: number) => {
    if (!ms) return ''
    if (ms < 2000) return 'Cepat'
    if (ms < 5000) return 'Normal'
    return 'Lambat'
  }

  const getProtocolInfo = () => {
    if (!status.protocol || status.status !== 'online') return null
    
    const isHttps = status.protocol === 'https'
    const isHttpOnly = status.protocol === 'http'
    const hasSSLIssue = status.error?.toLowerCase().includes('ssl') || 
                        status.error?.toLowerCase().includes('cert') ||
                        status.error?.toLowerCase().includes('sertifikat')
    
    return { isHttps, isHttpOnly, hasSSLIssue }
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
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
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
              {domainTags && domainTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {domainTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: `${tag.color}40`,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Notification Indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="shrink-0 flex items-center">
                    {domain.notificationsEnabled ? (
                      <Bell size={16} weight="fill" className="text-primary" />
                    ) : (
                      <BellSlash size={16} className="text-muted-foreground/40" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {domain.notificationsEnabled 
                    ? 'Notifikasi Aktif' 
                    : 'Notifikasi Nonaktif'}
                </TooltipContent>
              </Tooltip>

              {onEdit && existingUrls && (
                <EditDomainDialog
                  domain={domain}
                  onEdit={onEdit}
                  existingUrls={existingUrls}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(domain.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash size={16} />
              </Button>
            </div>
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
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-mono text-sm font-medium text-foreground truncate">
                {domain.url}
              </h3>
              
              {/* Protocol Badge */}
              {getProtocolInfo() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      getProtocolInfo()?.isHttps 
                        ? 'bg-success/15 text-success' 
                        : getProtocolInfo()?.hasSSLIssue
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-warning/15 text-warning'
                    }`}>
                      {getProtocolInfo()?.isHttps ? (
                        <LockKey size={10} weight="fill" />
                      ) : getProtocolInfo()?.hasSSLIssue ? (
                        <ShieldWarning size={10} weight="fill" />
                      ) : (
                        <LockKeyOpen size={10} weight="fill" />
                      )}
                      <span>{status.protocol?.toUpperCase()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    {getProtocolInfo()?.isHttps && (
                      <p>🔒 Koneksi HTTPS aman (terenkripsi)</p>
                    )}
                    {getProtocolInfo()?.hasSSLIssue && (
                      <p>⚠️ SSL Issue: {status.error}</p>
                    )}
                    {getProtocolInfo()?.isHttpOnly && (
                      <p>⚠️ HTTP saja (tidak terenkripsi) - Pertimbangkan aktifkan HTTPS</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
              
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
            {domainTags && domainTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {domainTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: `${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
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
            
            <div className="flex items-center gap-1">
              <span className={`font-medium ${
                status.status === 'online' ? '' :
                status.status === 'dns-only' ? '' :
                status.status === 'offline' ? 'text-destructive' :
                'text-muted-foreground'
              }`}
              style={
                status.status === 'online' ? { color: 'oklch(0.70 0.22 145)' } :
                status.status === 'dns-only' ? { color: 'rgb(245, 158, 11)' } :
                undefined
              }>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {status.responseTime < 2000 && (
                      <Lightning size={12} weight="fill" className="text-success" />
                    )}
                    <span className={`font-mono font-medium ${getResponseTimeColor(status.responseTime)}`}>
                      {status.responseTime}ms
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p className="font-semibold">{getResponseTimeLabel(status.responseTime)}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {status.responseTime < 2000 && '⚡ Sangat responsif'}
                    {status.responseTime >= 2000 && status.responseTime < 5000 && '✓ Performa normal'}
                    {status.responseTime >= 5000 && '⚠️ Respons lambat'}
                  </p>
                </TooltipContent>
              </Tooltip>
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

        </div>
      </Card>
    </motion.div>
  )
}
