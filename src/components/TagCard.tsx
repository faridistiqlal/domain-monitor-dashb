import { useState } from 'react'
import { Pencil, Trash, Tag as TagIcon, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DomainTag, Domain } from '@/lib/types'

interface TagCardProps {
  tag: DomainTag
  domainCount: number
  domains: Domain[]
  onEdit?: (tag: DomainTag) => void
  onDelete?: (tagId: string) => void
}

export function TagCard({ tag, domainCount, domains, onEdit, onDelete }: TagCardProps) {
  const [showDomainsDialog, setShowDomainsDialog] = useState(false)
  
  // Filter domains that have this tag
  const taggedDomains = domains.filter(d => d.tags?.includes(tag.id))
  
  return (
    <>
      <Card 
        className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setShowDomainsDialog(true)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${tag.color}20` }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{tag.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {domainCount} domain
              </p>
            </div>
            <CaretRight size={16} className="text-muted-foreground mt-1 flex-shrink-0" />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(tag)}
                className="h-8 w-8 p-0"
              >
                <Pencil size={14} />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash size={14} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Yakin ingin menghapus tag "{tag.name}"? Tag akan dihapus dari {domainCount} domain.
                      Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(tag.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </Card>

      {/* Domains List Dialog */}
      <Dialog open={showDomainsDialog} onOpenChange={setShowDomainsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: `${tag.color}20` }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              </div>
              {tag.name}
            </DialogTitle>
            <DialogDescription>
              {taggedDomains.length} domain dengan tag ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {taggedDomains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TagIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada domain dengan tag ini</p>
              </div>
            ) : (
              taggedDomains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      domain.status === 'online' ? 'bg-green-500' :
                      domain.status === 'dns-only' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">{domain.url}</p>
                      {domain.group && (
                        <p className="text-xs text-muted-foreground">
                          Group: {domain.group}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.open(`https://${domain.url}`, '_blank')
                    }}
                  >
                    Buka
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
