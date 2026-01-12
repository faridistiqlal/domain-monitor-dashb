import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash, Warning, Globe, Copy, Tag, Bell, BellSlash, LockKey, LockKeyOpen, ShieldWarning, Lightning, Play, Pause, ChartLine, MapPin, X as XIcon, DotsThree, Folder } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { EditDomainDialog } from './EditDomainDialog'
import { DomainStatisticsDialog } from './DomainStatisticsDialog'
import { Domain, DomainStatus, DomainGroup, DomainTag } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface DomainCardProps {
  domain: Domain
  status: DomainStatus
  onDelete: (id: string) => void
  onEdit?: (id: string, newUrl: string) => void
  onToggleMonitoring?: (id: string) => void
  onTogglePin?: (id: string) => void
  existingUrls?: string[]
  group?: DomainGroup
  tags?: DomainTag[]
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showCheckbox?: boolean
  simpleMode?: boolean
}

export function DomainCard({ domain, status, onDelete, onEdit, onToggleMonitoring, onTogglePin, existingUrls, group, tags, isSelected, onSelect, showCheckbox, simpleMode }: DomainCardProps) {
  const [showStats, setShowStats] = useState(false)
  
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

  const handleToggleMonitoring = () => {
    if (onToggleMonitoring) {
      onToggleMonitoring(domain.id)
    }
  }

  const domainTags = domain.tags?.map(tagId => tags?.find(t => t.id === tagId)).filter(Boolean) as DomainTag[] | undefined
  const isEnabled = domain.enabled === true // Only enabled if explicitly set to true (default: false)

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
        <Card className={`group transition-all duration-200 p-2 md:p-3 ${isSelected ? 'bg-destructive/10 border-destructive/50' : 'hover:shadow-md hover:bg-accent/5'}`}>
          <div className="flex flex-col gap-2">
            {/* Row 1: Checkbox + URL */}
            <div className="flex items-center gap-2 min-w-0">
              {showCheckbox && (
                <div className="shrink-0 flex items-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect?.(domain.id, checked as boolean)}
                    className="shrink-0 outline-none focus-visible:outline-none focus-visible:ring-0 h-5 w-5 md:h-4 md:w-4"
                  />
                </div>
              )}
              
              <h3 className="font-mono text-base md:text-sm font-medium text-foreground truncate flex-1">
                {domain.url}
              </h3>
            </div>

            {/* Row 2: Badges + Action buttons */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Badges */}
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                {!isEnabled && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Paused
                  </Badge>
                )}
                {group && (
                  <div 
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] shrink-0"
                    style={{ backgroundColor: `${group.color}20`, color: group.color }}
                  >
                    <Folder size={9} weight="fill" />
                    <span className="font-medium">{group.name}</span>
                  </div>
                )}
                {domainTags && domainTags.length > 0 && (
                  <>
                    {domainTags.map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] shrink-0"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                        }}
                      >
                        <Tag size={9} weight="fill" />
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
              {/* Notification Indicator */}
              <div className="shrink-0 flex items-center mr-1">
                {domain.notificationsEnabled ? (
                  <Bell size={16} weight="fill" className="text-primary" />
                ) : (
                  <BellSlash size={16} className="text-muted-foreground/40" />
                )}
              </div>

              {/* Action Buttons */}
              {/* Play/Pause Button */}
              {onToggleMonitoring && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMonitoring}
                  className="h-9 w-9 md:h-7 md:w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title={isEnabled ? 'Pause' : 'Play'}
                >
                  {isEnabled ? <Pause size={18} weight="fill" className="md:hidden" /> : <Play size={18} weight="fill" className="md:hidden" />}
                  {isEnabled ? <Pause size={16} weight="fill" className="hidden md:block" /> : <Play size={16} weight="fill" className="hidden md:block" />}
                </Button>
              )}

              {onEdit && existingUrls && (
                <EditDomainDialog
                  domain={domain}
                  onEdit={onEdit}
                  existingUrls={existingUrls}
                />
              )}
              
              {/* Pin Button */}
              {onTogglePin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTogglePin(domain.id)}
                  className={`h-9 w-9 md:h-7 md:w-7 ${domain.pinned ? 'text-primary' : 'text-muted-foreground'} hover:text-primary hover:bg-primary/10`}
                  title={domain.pinned ? 'Unpin' : 'Pin'}
                >
                  {domain.pinned ? <MapPin size={18} weight="fill" className="md:hidden" /> : <MapPin size={18} className="md:hidden" />}
                  {domain.pinned ? <MapPin size={16} weight="fill" className="hidden md:block" /> : <MapPin size={16} className="hidden md:block" />}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(domain.id)}
                className="h-9 w-9 md:h-7 md:w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash size={18} className="md:hidden" />
                <Trash size={16} className="hidden md:block" />
              </Button>
              </div>
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
      <Card className={`group transition-all duration-200 p-2 md:p-3 ${isSelected ? 'bg-destructive/10 border-destructive/50' : 'hover:shadow-md hover:bg-accent/5'}`}>
        <div className="flex items-center gap-2">
          {showCheckbox && (
            <div className="shrink-0 flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(domain.id, checked as boolean)}
                className="shrink-0 outline-none focus-visible:outline-none focus-visible:ring-0 h-5 w-5 md:h-4 md:w-4"
              />
            </div>
          )}
          <StatusIndicator status={status.status} className="shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <h3 className="font-mono text-base md:text-sm font-medium text-foreground truncate">
                {domain.url}
              </h3>
              
              {group && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0"
                      style={{ backgroundColor: `${group.color}20`, color: group.color }}
                    >
                      <Folder size={10} weight="fill" />
                      <span className="font-medium">{group.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grup: {group.name}</p>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {domainTags && domainTags.length > 0 && (
                <>
                  {domainTags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: `${tag.color}40`,
                      }}
                    >
                      <Tag size={10} weight="fill" />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {/* Quick info with Protocol & Batch badges */}
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
              {status.ipAddress && (
                <span className="font-mono text-muted-foreground">{status.ipAddress}</span>
              )}
              
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
              
              {/* Batch Indicator */}
              {domain.checkBatch && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="shrink-0 flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                      <span>B{domain.checkBatch}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Batch {domain.checkBatch} - Auto check setiap 20 menit</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {status.responseTime !== undefined && (
                <span className="flex items-center gap-1">
                  {status.responseTime < 2000 && (
                    <Lightning size={12} weight="fill" className="text-success" />
                  )}
                  <span className={`font-mono ${getResponseTimeColor(status.responseTime)}`}>
                    {status.responseTime}ms
                  </span>
                </span>
              )}
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(`https://${domain.url}`, '_blank', 'noopener,noreferrer')}
                  className="h-6 w-6 text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  <Globe size={14} />
                </Button>
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
          </div>

        </div>
      </Card>
      
      {/* Statistics Dialog */}
      <DomainStatisticsDialog
        domainId={domain.id}
        domainUrl={domain.url}
        open={showStats}
        onOpenChange={setShowStats}
      />
    </motion.div>
  )
}
