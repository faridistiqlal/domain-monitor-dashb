import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { validateDomain, normalizeDomain } from '@/lib/monitoring'

interface AddDomainFormProps {
  onAdd: (url: string) => void
}

export function AddDomainForm({ onAdd }: AddDomainFormProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateDomain(input)
    if (!validation.valid) {
      setError(validation.error || 'Domain tidak valid')
      return
    }

    const normalized = normalizeDomain(input)
    onAdd(normalized)
    setInput('')
    setError('')
  }

  return (
    <Card className="p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            id="domain-input"
            type="text"
            placeholder="contoh: sismple.kendalkab.go.id"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            className="flex-1 font-mono text-sm h-9 focus:ring-2 focus:ring-accent"
          />
          <Button 
            type="submit" 
            size="sm"
            className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 transition-all h-9"
          >
            <Plus size={18} weight="bold" />
            Tambah
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </form>
    </Card>
  )
}
