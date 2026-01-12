import { useState } from 'react'
import { FolderOpen, Tag, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Domain, DomainGroup } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AssignDomainsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domains: Domain[]
  groups: DomainGroup[]
  onAssign: (domainIds: string[], groupId: string | null) => void
}

export function AssignDomainsDialog({
  open,
  onOpenChange,
  domains,
  groups,
  onAssign,
}: AssignDomainsDialogProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter domains based on search
  const filteredDomains = domains.filter(domain =>
    domain.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDomains.length === filteredDomains.length) {
      setSelectedDomains([])
    } else {
      setSelectedDomains(filteredDomains.map((d) => d.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDomains.length === 0) return

    onAssign(
      selectedDomains,
      selectedGroup === 'none' ? null : selectedGroup || null
    )
    setSelectedDomains([])
    setSelectedGroup('')
    setSearchQuery('')
    onOpenChange(false)
  }

  const handleOpenChangeInternal = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedDomains([])
      setSelectedGroup('')
      setSearchQuery('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Atur Grup Domain</DialogTitle>
          <DialogDescription>
            Pilih domain dan grup untuk mengelompokkan domain
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cari Domain</Label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pilih Domain ({selectedDomains.length}/{filteredDomains.length})</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs"
              >
                {selectedDomains.length === filteredDomains.length && filteredDomains.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-3">
              <div className="space-y-2">
                {filteredDomains.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? 'Tidak ada domain yang cocok' : 'Tidak ada domain'}
                  </div>
                ) : (
                  filteredDomains.map(domain => (
                    <div key={domain.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`domain-${domain.id}`}
                        checked={selectedDomains.includes(domain.id)}
                        onCheckedChange={() => handleToggleDomain(domain.id)}
                      />
                      <label
                        htmlFor={`domain-${domain.id}`}
                        className="text-xs flex-1 cursor-pointer font-mono"
                      >
                        {domain.url}
                      </label>
                      {domain.groupId && (
                        <Tag size={12} className="text-muted-foreground" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-group">Grup Tujuan</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger id="target-group">
                <SelectValue placeholder="Pilih grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Tanpa Grup</span>
                </SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={selectedDomains.length === 0 || !selectedGroup}
            >
              <FolderOpen size={14} className="mr-1.5" />
              Atur Grup
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
