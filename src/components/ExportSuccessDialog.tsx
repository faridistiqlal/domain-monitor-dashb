import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, DownloadSimple, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useState } from 'react'

interface ExportSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  downloadUrl: string
  filename: string
  domainCount: number
}

export function ExportSuccessDialog({ 
  open, 
  onOpenChange, 
  downloadUrl, 
  filename,
  domainCount 
}: ExportSuccessDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl)
    setCopied(true)
    toast.success('Link berhasil disalin')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadAgain = () => {
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('File sedang didownload lagi')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle size={24} weight="duotone" className="text-success" />
            </div>
            <div>
              <DialogTitle>Export Berhasil!</DialogTitle>
              <DialogDescription>
                {domainCount} domain berhasil diekspor
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Nama File:</p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted font-mono text-xs break-all">
              {filename}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Link Download:</p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted font-mono text-xs break-all max-h-20 overflow-auto">
              {downloadUrl}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full"
            >
              {copied ? (
                <>
                  <CheckCircle size={16} className="text-success" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Salin Link
                </>
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAgain}
              className="w-full"
            >
              <DownloadSimple size={16} />
              Download Lagi
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            File sudah otomatis terdownload. Klik "Download Lagi" jika download gagal atau ingin download ulang.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
