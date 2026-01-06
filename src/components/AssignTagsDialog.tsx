import { useState, useMemo } from 'react'
import { Tag, Check, MagnifyingGlass, X } from '@phosphor-icons/react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Domain, DomainTag } from '@/lib/types'
import { useDebounce } from '@/hooks/use-debounce'

interface AssignTagsDialogProps {
  domains: Domain[]
  tags: DomainTag[]
  onAssign: (domainIds: string[], tagIds: string[]) => void
}

export function AssignTagsDialog({ domains, tags, onAssign }: AssignTagsDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [domainSearchQuery, setDomainSearchQuery] = useState('')
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const debouncedDomainSearch = useDebounce(domainSearchQuery, 300)
  const debouncedTagSearch = useDebounce(tagSearchQuery, 300)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedDomains(new Set())
      setSelectedTags(new Set())
      setDomainSearchQuery('')
      setTagSearchQuery('')
    }
  }

  const handleToggleDomain = (domainId: string) => {
    setSelectedDomains(prev => {
      const newSet = new Set(prev)
      if (newSet.has(domainId)) {
        newSet.delete(domainId)
      } else {
        newSet.add(domainId)
      }
      return newSet
    })
  }

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
      }
      return newSet
    })
  }

  const handleAssign = () => {
    if (selectedDomains.size === 0 || selectedTags.size === 0) return
    onAssign(Array.from(selectedDomains), Array.from(selectedTags))
    handleOpenChange(false)
  }

  const domainsByGroup = useMemo(() => {
    const filtered = domains.filter(d => 
      debouncedDomainSearch === '' || 
      d.url.toLowerCase().includes(debouncedDomainSearch.toLowerCase())
    )
    const ungrouped = filtered.filter(d => !d.groupId)
    const grouped = filtered.filter(d => d.groupId)
    return { ungrouped, grouped, all: filtered }
  }, [domains, debouncedDomainSearch])

  const filteredTags = useMemo(() => {
    return tags.filter(t =>
      debouncedTagSearch === '' ||
      t.name.toLowerCase().includes(debouncedTagSearch.toLowerCase())
    )
  }, [tags, debouncedTagSearch])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Tag size={14} />
          Atur Tag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag size={20} weight="duotone" />
            Atur Tag Domain
          </DialogTitle>
          <DialogDescription>
            Pilih domain dan tag yang ingin diatur
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Domain ({selectedDomains.size} dipilih)</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedDomains.size === domainsByGroup.all.length) {
                    setSelectedDomains(new Set())
                  } else {
                    setSelectedDomains(new Set(domainsByGroup.all.map(d => d.id)))
                  }
                }}
                className="h-7 text-xs"
              >
                {selectedDomains.size === domainsByGroup.all.length && domainsByGroup.all.length > 0 ? 'Batalkan' : 'Pilih Semua'}
              </Button>
            </div>
            
            <div className="relative">
              <MagnifyingGlass 
                size={14} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
              />
              <Input
                type="text"
                placeholder="Cari domain..."
                value={domainSearchQuery}
                onChange={(e) => setDomainSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs"
              />
              {domainSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDomainSearchQuery('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                >
                  <X size={14} className="text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[280px] border rounded-lg">
              <div className="p-3 space-y-2">
                {domains.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Tidak ada domain
                  </p>
                ) : domainsByGroup.all.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Tidak ada domain yang cocok dengan "{debouncedDomainSearch}"
                  </p>
                ) : (
                  <>
                    {domainsByGroup.ungrouped.map(domain => (
                      <div
                        key={domain.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleDomain(domain.id)}
                      >
                        <Checkbox
                          checked={selectedDomains.has(domain.id)}
                          onCheckedChange={() => handleToggleDomain(domain.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{domain.url}</p>
                          {domain.tags && domain.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {domain.tags.slice(0, 2).map(tagId => {
                                const tag = tags.find(t => t.id === tagId)
                                if (!tag) return null
                                return (
                                  <Badge
                                    key={tagId}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                    style={{
                                      backgroundColor: `${tag.color}20`,
                                      color: tag.color,
                                      borderColor: `${tag.color}40`,
                                    }}
                                  >
                                    {tag.name}
                                  </Badge>
                                )
                              })}
                              {domain.tags.length > 2 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  +{domain.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {domainsByGroup.grouped.map(domain => (
                      <div
                        key={domain.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleDomain(domain.id)}
                      >
                        <Checkbox
                          checked={selectedDomains.has(domain.id)}
                          onCheckedChange={() => handleToggleDomain(domain.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{domain.url}</p>
                          {domain.tags && domain.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {domain.tags.slice(0, 2).map(tagId => {
                                const tag = tags.find(t => t.id === tagId)
                                if (!tag) return null
                                return (
                                  <Badge
                                    key={tagId}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                    style={{
                                      backgroundColor: `${tag.color}20`,
                                      color: tag.color,
                                      borderColor: `${tag.color}40`,
                                    }}
                                  >
                                    {tag.name}
                                  </Badge>
                                )
                              })}
                              {domain.tags.length > 2 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  +{domain.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Tag ({selectedTags.size} dipilih)</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedTags.size === filteredTags.length) {
                    setSelectedTags(new Set())
                  } else {
                    setSelectedTags(new Set(filteredTags.map(t => t.id)))
                  }
                }}
                className="h-7 text-xs"
              >
                {selectedTags.size === filteredTags.length && filteredTags.length > 0 ? 'Batalkan' : 'Pilih Semua'}
              </Button>
            </div>
            
            <div className="relative">
              <MagnifyingGlass 
                size={14} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
              />
              <Input
                type="text"
                placeholder="Cari tag..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs"
              />
              {tagSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTagSearchQuery('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                >
                  <X size={14} className="text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[280px] border rounded-lg">
              <div className="p-3 space-y-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Belum ada tag. Buat tag terlebih dahulu.
                  </p>
                ) : filteredTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Tidak ada tag yang cocok dengan "{debouncedTagSearch}"
                  </p>
                ) : (
                  filteredTags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                      />
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm flex-1">{tag.name}</span>
                      {selectedTags.has(tag.id) && (
                        <Check size={16} weight="bold" className="text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
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
          <Button
            onClick={handleAssign}
            disabled={selectedDomains.size === 0 || selectedTags.size === 0}
          >
            Tambah Tag ke {selectedDomains.size} Domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
