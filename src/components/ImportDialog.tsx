import { useState } from 'react'
import { UploadSimple, FileText, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { importDomainsFromCSV, ImportResult } from '@/lib/csv-import'
import { Domain } from '@/lib/types'

interface ImportDialogProps {
  existingDomains: Domain[]
  onImport: (domains: Domain[]) => void
}

export function ImportDialog({ existingDomains, onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)

    try {
      const text = await file.text()
      const importResult = importDomainsFromCSV(text, existingDomains)
      setResult(importResult)

      if (importResult.success.length > 0) {
        onImport(importResult.success)
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
        >
          <UploadSimple size={14} />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Domain dari CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV dengan daftar domain untuk ditambahkan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Klik untuk pilih file CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: domain di kolom pertama
                  </p>
                </div>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-accent" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Berhasil ditambahkan:</span>
                <span className="font-semibold text-success">{result.success.length}</span>
              </div>
              {result.duplicates.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duplikat (dilewati):</span>
                  <span className="font-semibold text-accent">{result.duplicates.length}</span>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gagal (tidak valid):</span>
                  <span className="font-semibold text-destructive">{result.failed.length}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {result ? (
              <Button onClick={handleClose} className="flex-1">
                Selesai
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || isProcessing}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isProcessing ? 'Memproses...' : 'Import'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
