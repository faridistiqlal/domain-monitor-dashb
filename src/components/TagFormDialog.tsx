import { useState } from 'react'
import { Plus, Tag } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DomainTag } from '@/lib/types'

const TAG_COLORS = [
  { name: 'Blue', value: 'oklch(0.55 0.15 250)' },
  { name: 'Green', value: 'oklch(0.70 0.22 145)' },
  { name: 'Orange', value: 'oklch(0.70 0.18 50)' },
  { name: 'Red', value: 'oklch(0.60 0.25 25)' },
  { name: 'Purple', value: 'oklch(0.60 0.20 300)' },
  { name: 'Cyan', value: 'oklch(0.70 0.18 200)' },
  { name: 'Pink', value: 'oklch(0.65 0.25 350)' },
  { name: 'Yellow', value: 'oklch(0.75 0.20 90)' },
]

interface TagFormDialogProps {
  tag?: DomainTag
  onSave: (tagData: Omit<DomainTag, 'id' | 'createdAt'>) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TagFormDialog({ tag, onSave, open: controlledOpen, onOpenChange }: TagFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(tag?.name || '')
  const [selectedColor, setSelectedColor] = useState(tag?.color || TAG_COLORS[0].value)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setOpen(newOpen)
    }
    if (!newOpen) {
      setName(tag?.name || '')
      setSelectedColor(tag?.color || TAG_COLORS[0].value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      color: selectedColor,
    })

    handleOpenChange(false)
    setName('')
    setSelectedColor(TAG_COLORS[0].value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {!isControlled && (
          <Button size="sm" className="h-8">
            <Plus size={14} weight="bold" />
            Buat Tag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={20} weight="duotone" />
              {tag ? 'Edit Tag' : 'Buat Tag Baru'}
            </DialogTitle>
            <DialogDescription>
              {tag ? 'Ubah informasi tag' : 'Buat tag untuk mengorganisir domain'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nama Tag</Label>
              <Input
                id="tag-name"
                placeholder="contoh: Produksi, Development, Testing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Warna Tag</Label>
              <div className="grid grid-cols-4 gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className="h-10 rounded-lg border-2 transition-all hover:scale-105"
                    style={{
                      backgroundColor: color.value,
                      borderColor: selectedColor === color.value ? 'white' : 'transparent',
                      opacity: selectedColor === color.value ? 1 : 0.6,
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {tag ? 'Simpan' : 'Buat Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
