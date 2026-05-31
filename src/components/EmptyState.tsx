import { Globe } from '@phosphor-icons/react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Globe size={40} className="text-primary" weight="duotone" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-foreground">
        Belum Ada Domain yang Dipantau
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        Tambahkan domain yang diizinkan oleh konfigurasi sistem Anda untuk mulai memantau status website secara real-time.
      </p>

      <div className="bg-card border border-border rounded-lg p-4 max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Contoh domain:</p>
        <ul className="space-y-1 text-sm font-mono text-foreground">
          <li>• monitoring.instansi.go.id</li>
          <li>• portal.instansi.go.id</li>
          <li>• layanan.instansi.go.id</li>
        </ul>
      </div>
    </div>
  )
}
