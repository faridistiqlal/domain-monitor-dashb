import { useState, useEffect } from 'react'
import { Plus, Folder } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DomainGroup } from '@/lib/types'

interface GroupFormDialogProps {
  group?: DomainGroup
  onSave: (group: Omit<DomainGroup, 'id' | 'createdAt'>) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

export function GroupFormDialog({ group, onSave, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: GroupFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [color, setColor] = useState(group?.color || PRESET_COLORS[0])

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description || '')
      setColor(group.color)
    }
  }, [group])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    })

    if (!group) {
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[0])
    }
    setOpen(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !group) {
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[0])
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="h-8">
            <Plus size={14} weight="bold" />
            Buat Grup
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Grup' : 'Buat Grup Baru'}</DialogTitle>
          <DialogDescription>
            {group 
              ? 'Ubah informasi grup domain'
              : 'Buat grup untuk mengelompokkan domain berdasarkan kategori'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nama Grup</Label>
            <Input
              id="group-name"
              placeholder="Misal: Website Dinas, Portal Publik, dll"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Deskripsi (Opsional)</Label>
            <Textarea
              id="group-description"
              placeholder="Deskripsi singkat tentang grup ini"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Warna Grup</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className="w-8 h-8 rounded-lg transition-all hover:scale-110 relative"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                >
                  {color === presetColor && (
                    <div className="absolute inset-0 rounded-lg ring-2 ring-offset-2 ring-offset-background ring-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              <Folder size={14} className="mr-1.5" weight="duotone" />
              {group ? 'Simpan' : 'Buat Grup'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
