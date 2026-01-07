import { useState, useEffect } from 'react'
import { ClockCounterClockwise, CheckCircle, XCircle, ArrowDown, ArrowUp, ClockClockwise, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { NotificationHistory } from '@/lib/notifications'

interface NotificationHistoryDialogProps {
  getHistory: () => NotificationHistory[]
  clearHistory: () => void
}

export function NotificationHistoryDialog({ getHistory, clearHistory }: NotificationHistoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<NotificationHistory[]>([])

  useEffect(() => {
    if (open) {
      setHistory(getHistory())
    }
  }, [open, getHistory])

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'down':
        return <ArrowDown size={16} weight="duotone" className="text-destructive" />
      case 'recovery':
        return <ArrowUp size={16} weight="duotone" className="text-success" />
      case 'slow':
        return <ClockClockwise size={16} weight="duotone" className="text-warning" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      down: 'destructive',
      recovery: 'default',
      slow: 'secondary',
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <ClockCounterClockwise size={16} weight="duotone" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ClockCounterClockwise size={20} weight="duotone" />
                Notification History
              </DialogTitle>
              <DialogDescription>
                Riwayat notifikasi yang telah dikirim ke Slack
              </DialogDescription>
            </div>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Trash size={16} weight="duotone" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Semua History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua riwayat notifikasi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Hapus Semua
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[calc(85vh-180px)] pr-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClockCounterClockwise size={48} weight="duotone" className="text-muted-foreground/40 mb-4" />
              <p className="text-sm font-medium text-foreground">Belum Ada History</p>
              <p className="text-xs text-muted-foreground mt-1">
                Notifikasi yang dikirim akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {entry.success ? (
                      <CheckCircle size={20} weight="duotone" className="text-success" />
                    ) : (
                      <XCircle size={20} weight="duotone" className="text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(entry.status)}
                        <span className="text-sm font-medium text-foreground truncate">
                          {entry.domain}
                        </span>
                        {getStatusBadge(entry.status)}
                        {!entry.success && (
                          <Badge variant="destructive" className="text-xs">
                            FAILED
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {entry.groupName && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Group:</span>
                          <span className="text-foreground font-medium">{entry.groupName}</span>
                        </div>
                      )}
                      {entry.responseTime && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Response:</span>
                          <span className="text-foreground font-medium">{entry.responseTime.toFixed(2)}s</span>
                        </div>
                      )}
                      {entry.protocol && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Protocol:</span>
                          <span className="text-foreground font-medium">{entry.protocol.toUpperCase()}</span>
                        </div>
                      )}
                      {entry.ipAddress && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">IP:</span>
                          <span className="text-foreground font-mono text-[10px]">{entry.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">Tags:</span>
                        {entry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] h-5 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {entry.errorMessage && (
                      <div className="flex items-start gap-1 mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <span className="text-xs text-muted-foreground">Error:</span>
                        <span className="text-xs text-destructive font-mono flex-1">{entry.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {history.length} notifikasi</span>
          <span>Maksimal 100 riwayat tersimpan</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
