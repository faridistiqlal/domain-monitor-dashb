import { useState } from 'react'
import { Domain, DomainHistory } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UptimeTimeline } from './UptimeTimeline'
import { ChartLine } from '@phosphor-icons/react'

interface UptimeDetailsDialogProps {
  domain: Domain
  history: DomainHistory | undefined
}

export function UptimeDetailsDialog({ domain, history }: UptimeDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<24 | 48 | 168>(48)

  if (!history || !history.records || history.records.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          title="Lihat Riwayat Uptime"
        >
          <ChartLine size={14} />
          Riwayat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartLine size={20} weight="duotone" />
            Riwayat Uptime
          </DialogTitle>
          <DialogDescription className="font-mono text-sm">
            {domain.url}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs
            value={timeRange.toString()}
            onValueChange={(val) => setTimeRange(Number(val) as 24 | 48 | 168)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="24">24 Jam</TabsTrigger>
              <TabsTrigger value="48">48 Jam</TabsTrigger>
              <TabsTrigger value="168">7 Hari</TabsTrigger>
            </TabsList>

            <TabsContent value="24" className="space-y-4 mt-4">
              <UptimeTimeline history={history} timeRangeHours={24} />
            </TabsContent>

            <TabsContent value="48" className="space-y-4 mt-4">
              <UptimeTimeline history={history} timeRangeHours={48} />
            </TabsContent>

            <TabsContent value="168" className="space-y-4 mt-4">
              <UptimeTimeline history={history} timeRangeHours={168} />
            </TabsContent>
          </Tabs>

          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'oklch(0.70 0.22 145)' }} />
                <span className="text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(245, 158, 11)' }} />
                <span className="text-muted-foreground">DNS Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'oklch(0.60 0.25 25)' }} />
                <span className="text-muted-foreground">Offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'oklch(0.35 0.02 250)' }} />
                <span className="text-muted-foreground">Tidak Ada Data</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
