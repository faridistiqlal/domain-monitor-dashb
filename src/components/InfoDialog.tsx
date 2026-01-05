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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
        
        <Accordion type="multiple" defaultValue={[]} className="w-full pt-2">
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-semibold">
              Status Monitoring
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
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
                      <span className="font-medium text-foreground"> tetapi web server HTTP/HTTPS tidak merespons atau timeout</span>. 
                      Kemungkinan penyebab:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                      <li>Web server (Apache/Nginx) sedang mati atau bermasalah</li>
                      <li>Konfigurasi firewall memblokir port 80/443</li>
                      <li>Service web hosting belum diaktifkan di cPanel/VM</li>
                      <li>Virtual host tidak dikonfigurasi dengan benar</li>
                      <li>Server timeout/sangat lambat (&gt;6 detik)</li>
                      <li><span className="font-medium text-foreground">Sertifikat SSL bermasalah:</span> Sertifikat kadaluarsa (ERR_CERT_DATE_INVALID), tidak valid, atau tidak cocok dengan domain</li>
                      <li><span className="font-medium text-foreground">Network-specific issue:</span> Website hanya bisa diakses dari jaringan tertentu karena pembatasan IP/firewall</li>
                      <li><span className="font-medium text-foreground">CORS/Browser security:</span> Browser memblokir akses cross-origin dari aplikasi monitoring ini</li>
                    </ul>
                    <p className="text-sm text-amber-500 font-medium pt-1">
                      ⚠️ Pengunjung mungkin tidak dapat mengakses website atau akses sangat lambat
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cara-kerja">
            <AccordionTrigger className="text-sm font-semibold">
              Cara Kerja Monitoring
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="troubleshooting">
            <AccordionTrigger className="text-sm font-semibold">
              Tips Troubleshooting
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold text-amber-500 mb-1">Status "DNS Only" setelah publish:</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Jika banyak domain menunjukkan status DNS Only setelah aplikasi di-publish, kemungkinan:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li><span className="font-semibold text-foreground">Browser Security (CORS):</span> Browser memblokir cross-origin request dari aplikasi ke domain yang tidak mengizinkan akses cross-origin. Solusi: cek langsung ke website aslinya untuk memastikan.</li>
                    <li><span className="font-semibold text-foreground">Firewall/IP Restriction:</span> Server hanya mengizinkan akses dari IP tertentu. Monitoring dari GitHub App mungkin terblokir.</li>
                    <li><span className="font-semibold text-foreground">Server Slow/Overload:</span> Timeout 6 detik tercapai karena server lambat atau overload.</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold text-amber-500 mb-1">Verifikasi Manual:</p>
                  <p className="text-sm text-muted-foreground">
                    Untuk domain yang status DNS Only, <span className="font-semibold text-foreground">klik icon globe</span> untuk membuka website di tab baru. 
                    Jika website terbuka dengan baik, berarti masalahnya adalah browser security/CORS, bukan server mati. 
                    Jika muncul peringatan SSL, periksa sertifikat SSL domain tersebut.
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold text-amber-500 mb-1">Sertifikat SSL Bermasalah:</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Jika error message menunjukkan masalah SSL (Sertifikat Kadaluarsa, Tidak Valid, dll):
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li><span className="font-semibold text-foreground">Sertifikat Kadaluarsa:</span> Perbarui SSL certificate di cPanel/hosting</li>
                    <li><span className="font-semibold text-foreground">Sertifikat Tidak Valid:</span> Pastikan menggunakan SSL dari CA terpercaya atau setup Let's Encrypt</li>
                    <li><span className="font-semibold text-foreground">Domain Tidak Cocok:</span> SSL certificate tidak sesuai dengan nama domain yang digunakan</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold text-destructive mb-1">Status "Offline":</p>
                  <p className="text-sm text-muted-foreground">
                    Verifikasi DNS record di domain registrar. Pastikan A record atau CNAME 
                    mengarah ke IP server yang benar.
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold text-accent mb-1">Response Time 6000ms:</p>
                  <p className="text-sm text-muted-foreground">
                    Jika response time menunjukkan 6000ms, artinya koneksi timeout. 
                    Server tidak merespons dalam 6 detik. Cek apakah server overload, network lambat, atau ada blocking.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">
              Fitur Aplikasi
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Filter & Search:</span> Filter domain berdasarkan 
                    status (Online/DNS Only/Offline) dan cari domain spesifik dengan fitur pencarian
                  </p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Sorting:</span> Urutkan domain secara 
                    alfabetis (A-Z atau Z-A) atau berdasarkan status (Online pertama atau Offline pertama)
                  </p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Export/Import CSV:</span> Export daftar 
                    domain beserta statusnya ke file CSV, atau import domain dalam jumlah banyak dari CSV
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Informasi IP:</span> Setiap domain 
                    menampilkan IP address hasil DNS resolution untuk memudahkan troubleshooting
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Manual Refresh:</span> Selain auto-refresh 
                    60 detik, Anda dapat memperbarui status secara manual kapan saja
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  )
}
