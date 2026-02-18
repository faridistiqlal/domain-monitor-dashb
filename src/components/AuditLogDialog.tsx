import { useState, useEffect } from 'react'
import { ClockCounterClockwise, UserPlus, UserMinus, ShieldCheck, LockKey, Trash, ArrowsClockwise } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { fetchAuditLogs } from '@/lib/firestore-sync'
import type { AuditLogEntry } from '@/lib/types'

interface AuditLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ACTION_CONFIG: Record<AuditLogEntry['action'], { label: string; icon: typeof UserPlus; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'create-user': { label: 'Buat User', icon: UserPlus, color: 'text-success', badgeVariant: 'default' },
  'update-user-permission': { label: 'Ubah Permission', icon: ShieldCheck, color: 'text-primary', badgeVariant: 'secondary' },
  'toggle-user-active': { label: 'Toggle Aktif', icon: ArrowsClockwise, color: 'text-accent', badgeVariant: 'outline' },
  'change-password': { label: 'Ubah Password', icon: LockKey, color: 'text-yellow-500', badgeVariant: 'outline' },
  'delete-user': { label: 'Hapus User', icon: Trash, color: 'text-destructive', badgeVariant: 'destructive' },
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  let relative = ''
  if (diffMin < 1) relative = 'baru saja'
  else if (diffMin < 60) relative = `${diffMin} menit lalu`
  else if (diffHour < 24) relative = `${diffHour} jam lalu`
  else if (diffDay < 7) relative = `${diffDay} hari lalu`
  else relative = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${relative} · ${time}`
}

function renderChanges(action: AuditLogEntry['action'], changes: Record<string, unknown>): string | null {
  if (!changes || Object.keys(changes).length === 0) return null
  
  switch (action) {
    case 'create-user':
      return `Role: ${changes.role ?? '-'}`
    case 'update-user-permission':
      if (changes.newRole && changes.oldRole) return `${changes.oldRole} → ${changes.newRole}`
      return null
    case 'toggle-user-active':
      return changes.isActive ? 'Diaktifkan' : 'Dinonaktifkan'
    case 'delete-user':
      return changes.username ? `User: ${changes.username}` : null
    case 'change-password':
      return changes.method === 'firebase-auth' ? 'Via Firebase Auth' : null
    default:
      return null
  }
}

export function AuditLogDialog({ open, onOpenChange }: AuditLogDialogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchAuditLogs(100)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ClockCounterClockwise size={20} weight="duotone" className="text-primary" />
            Audit Log
          </DialogTitle>
          <DialogDescription>
            Riwayat aktivitas manajemen user ({logs.length} entri)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Memuat audit log...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClockCounterClockwise size={48} className="mb-3 opacity-50" />
              <p className="text-sm">Belum ada aktivitas tercatat</p>
            </div>
          ) : (
            <div className="relative mt-4">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
              
              <div className="space-y-1">
                {logs.map((log) => {
                  const config = ACTION_CONFIG[log.action]
                  const Icon = config.icon
                  const changeText = renderChanges(log.action, log.changes)

                  return (
                    <div key={log.id} className="relative flex gap-3 py-2.5 pl-1">
                      {/* Timeline dot */}
                      <div className={`w-[38px] h-[38px] rounded-full bg-card border-2 border-border flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                        <Icon size={16} weight="duotone" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          <span className="font-medium text-foreground">{log.actorUsername}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="font-mono text-xs text-foreground/80">{log.targetId}</span>
                        </p>
                        {changeText && (
                          <p className="text-xs text-muted-foreground mt-0.5">{changeText}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
