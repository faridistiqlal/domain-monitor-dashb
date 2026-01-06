import { Pencil, Trash, Tag as TagIcon } from '@phosphor-icons/react'
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
import { DomainTag } from '@/lib/types'

interface TagCardProps {
  tag: DomainTag
  domainCount: number
  onEdit: (tag: DomainTag) => void
  onDelete: (tagId: string) => void
}

export function TagCard({ tag, domainCount, onEdit, onDelete }: TagCardProps) {
  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
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
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tag)}
            className="h-8 w-8 p-0"
          >
            <Pencil size={14} />
          </Button>
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
        </div>
      </div>
    </Card>
  )
}
