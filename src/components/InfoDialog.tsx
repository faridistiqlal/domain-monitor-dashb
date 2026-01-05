import { Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function InfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Info size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Panduan Monitoring Domain</DialogTitle>
          <DialogDescription>
            Penjelasan status monitoring dan cara kerja sistem
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Status Monitoring
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)] mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="font-semibold text-success">Online</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Website dapat diakses dengan sempurna. Server DNS merespons (domain dapat di-resolve) 
                    dan web server HTTP/HTTPS juga merespons dengan baik (status 200-299). 
                    Artinya pengunjung dapat mengakses website tanpa masalah.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-500">DNS Only</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Server DNS berfungsi dan domain dapat di-resolve ke IP address (bisa di-ping), 
                    <span className="font-medium text-foreground"> tetapi web server HTTP/HTTPS tidak merespons</span>. 
                    Kemungkinan penyebab:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Web server (Apache/Nginx) sedang mati atau bermasalah</li>
                    <li>Konfigurasi firewall memblokir port 80/443</li>
                    <li>Service web hosting belum diaktifkan di cPanel/VM</li>
                    <li>Virtual host tidak dikonfigurasi dengan benar</li>
                    <li><span className="font-medium text-foreground">Network-specific issue:</span> Website hanya bisa diakses dari jaringan tertentu karena pembatasan IP/firewall</li>
                  </ul>
                  <p className="text-sm text-amber-500 font-medium pt-1">
                    ⚠️ Pengunjung tidak dapat mengakses website meski domain valid
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(244,67,54,0.6)] mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="font-semibold text-destructive">Offline</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Domain tidak dapat di-resolve sama sekali (DNS gagal). Kemungkinan penyebab:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>DNS record belum dikonfigurasi atau salah</li>
                    <li>Nameserver tidak aktif atau bermasalah</li>
                    <li>Domain expired atau tidak diperpanjang</li>
                    <li>Propagasi DNS belum selesai (untuk domain baru)</li>
                  </ul>
                  <p className="text-sm text-destructive font-medium pt-1">
                    ⚠️ Website sama sekali tidak dapat diakses dari internet
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Cara Kerja Monitoring
            </h3>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2 items-start">
                <span className="font-mono text-accent font-semibold">1.</span>
                <p>
                  <span className="font-semibold text-foreground">DNS Check:</span> Sistem mencoba 
                  me-resolve domain ke IP address menggunakan DNS lookup
                </p>
              </div>
              
              <div className="flex gap-2 items-start">
                <span className="font-mono text-accent font-semibold">2.</span>
                <p>
                  <span className="font-semibold text-foreground">HTTP Check:</span> Jika DNS berhasil, 
                  sistem melakukan request HTTP/HTTPS ke website untuk memeriksa apakah web server merespons
                </p>
              </div>
              
              <div className="flex gap-2 items-start">
                <span className="font-mono text-accent font-semibold">3.</span>
                <p>
                  <span className="font-semibold text-foreground">Auto-refresh:</span> Monitoring berjalan 
                  otomatis setiap 60 detik untuk memastikan data status selalu terkini
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Tips Troubleshooting
            </h3>
            
            <div className="space-y-3">
              <div className="bg-card border rounded-lg p-3">
                <p className="text-sm font-semibold text-amber-500 mb-1">Status "DNS Only":</p>
                <p className="text-sm text-muted-foreground">
                  Cek service web server di cPanel/VM, pastikan Apache/Nginx berjalan. 
                  Periksa juga konfigurasi firewall dan virtual host.
                </p>
              </div>
              
              <div className="bg-card border rounded-lg p-3">
                <p className="text-sm font-semibold text-destructive mb-1">Status "Offline":</p>
                <p className="text-sm text-muted-foreground">
                  Verifikasi DNS record di domain registrar. Pastikan A record atau CNAME 
                  mengarah ke IP server yang benar.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-3">
                <p className="text-sm font-semibold text-accent mb-1">Kasus Network-Specific:</p>
                <p className="text-sm text-muted-foreground">
                  Jika domain bisa di-ping tapi website tidak bisa diakses dari jaringan tertentu, 
                  kemungkinan ada pembatasan firewall berdasarkan IP. Coba akses dari jaringan lain 
                  atau gunakan VPN. Periksa konfigurasi <span className="font-mono">.htaccess</span>, 
                  iptables, atau firewall cPanel untuk whitelist/blacklist IP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
