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

interface InfoDialogProps {
  triggerText?: string
  asLink?: boolean
}

export function InfoDialog({ triggerText = 'Bantuan', asLink = false }: InfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {asLink ? (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {triggerText}
          </button>
        ) : (
          <Button variant="outline" size="sm" className="h-8">
            <Info size={14} />
            <span className="ml-1.5">{triggerText}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Panduan Monitoring Domain</DialogTitle>
          <DialogDescription>
            Penjelasan status monitoring dan cara kerja sistem
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 text-foreground">🚀 Quick Start</h3>
          <ol className="text-sm text-muted-foreground space-y-1.5 pl-5 list-decimal">
            <li><span className="font-semibold text-foreground">Tambah Domain:</span> Buka tab "Kelola", masukkan URL domain, klik "Tambah Domain"</li>
            <li><span className="font-semibold text-foreground">Pilih Mode:</span> Pilih "Auto" untuk monitoring real-time atau "Manual" untuk check sekali</li>
            <li><span className="font-semibold text-foreground">Individual Monitoring:</span> Klik Play (▶️) per domain untuk monitoring continuous setiap 5 menit</li>
            <li><span className="font-semibold text-foreground">Pin Favorit:</span> Klik icon Pin untuk pin domain favorit ke tab khusus dengan uptime visualization</li>
            <li><span className="font-semibold text-foreground">Monitor Status:</span> Lihat status Online (hijau), DNS Only (kuning), Offline (merah)</li>
            <li><span className="font-semibold text-foreground">Statistics:</span> Klik icon chart untuk lihat uptime & response time trends</li>
            <li><span className="font-semibold text-foreground">Export Data:</span> Klik tombol "Export" untuk download hasil monitoring ke CSV</li>
          </ol>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 text-foreground">📱 Mobile Usage</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 pl-5 list-disc">
            <li><span className="font-semibold text-foreground">Hamburger Menu:</span> Klik ☰ di kiri atas untuk akses Import, Export, Settings, Notifications</li>
            <li><span className="font-semibold text-foreground">Tab Navigation:</span> 3-kolom layout (Monitoring, Pin, Statistik / Grup, Tag, Kelola)</li>
            <li><span className="font-semibold text-foreground">Domain Actions:</span> Tap domain untuk quick info, gunakan three-dot menu (⋮) untuk actions lengkap</li>
            <li><span className="font-semibold text-foreground">Tab Kelola:</span> Action icons (Play, Edit, Pin, Delete) visible di baris kedua card</li>
            <li><span className="font-semibold text-foreground">Globe & Copy:</span> Icon globe (buka browser) dan copy URL ada di setiap domain card</li>
            <li><span className="font-semibold text-foreground">Touch Targets:</span> Semua buttons 36px+ untuk comfortable tap</li>
          </ul>
        </div>
        
        <Accordion type="multiple" defaultValue={["quick-tips"]} className="w-full pt-2">
          <AccordionItem value="quick-tips">
            <AccordionTrigger className="text-sm font-semibold">
              💡 Tips Cepat
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Gunakan <span className="font-semibold text-foreground">Individual Monitoring</span> (tombol Play) untuk domain penting yang perlu monitoring 24/7</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Klik icon <span className="font-semibold text-foreground">chart</span> di domain card untuk lihat statistics detail (uptime %, response time trends)</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Gunakan <span className="font-semibold text-foreground">Grup</span> untuk mengorganisir domain berdasarkan kategori (misalnya: Dinas, SKPD, Kecamatan)</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Gunakan <span className="font-semibold text-foreground">Tag</span> untuk label domain dengan atribut (misalnya: Prioritas Tinggi, Maintenance, Testing)</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Klik icon <span className="font-semibold text-foreground">globe</span> pada domain untuk buka website di tab baru dan verifikasi manual</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Export terfilter: Gunakan filter/search lalu klik "Export Terfilter" untuk export subset data</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Import CSV: Format sederhana dengan kolom "url" atau "domain", satu URL per baris</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Setup <span className="font-semibold text-foreground">Notifikasi Slack</span>: Klik icon Bell di header (atau hamburger menu di mobile), paste Webhook URL, aktifkan notification rules</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p>Per-domain notification: Edit domain, toggle "Enable Notifications" untuk kontrol notifikasi per domain</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p><span className="font-semibold text-foreground">Tab Pin:</span> Klik icon MapPin di domain card untuk pin ke tab favorit dengan uptime bar 90 hari</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p><span className="font-semibold text-foreground">Uptime Visualization:</span> Hover ke bar uptime untuk lihat detail persentase per hari (green=95%+, yellow=80-95%, orange=50-80%, red=&lt;50%)</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-accent">•</span>
                  <p><span className="font-semibold text-foreground">Auto-Check Pinned:</span> Domain di tab Pin otomatis ter-check saat tab dibuka, atau klik "Refresh Status" untuk manual refresh</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notifications">
            <AccordionTrigger className="text-sm font-semibold">
              🔔 Notifikasi Slack
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Aplikasi dapat mengirim notifikasi real-time ke Slack saat domain down atau recovery.
                </p>
                
                <div className="bg-card border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Setup Slack Webhook:</p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 pl-5 list-decimal">
                    <li>Buka <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.slack.com/apps</a></li>
                    <li>Create New App → From scratch → Nama app dan pilih workspace</li>
                    <li>Pilih "Incoming Webhooks" → Toggle ON</li>
                    <li>Click "Add New Webhook to Workspace" → Pilih channel</li>
                    <li>Copy Webhook URL (format: https://hooks.slack.com/services/...)</li>
                    <li>Klik icon <span className="font-semibold text-foreground">Bell (🔔)</span> di header aplikasi</li>
                    <li>Paste Webhook URL → Set notification rules → Save</li>
                    <li>Test dengan klik "Send Test" untuk verifikasi</li>
                  </ol>
                </div>

                <div className="bg-card border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Notification Rules:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li><span className="font-semibold text-foreground">Notify on Down:</span> Alert saat domain Online → Offline/DNS-Only</li>
                    <li><span className="font-semibold text-foreground">Notify on Recovery:</span> Alert saat domain Offline → Online</li>
                    <li><span className="font-semibold text-foreground">Notify on Slow:</span> Alert saat response time ≥ threshold (default 5s)</li>
                    <li><span className="font-semibold text-foreground">Cooldown:</span> Minimum waktu antar notifikasi untuk domain sama (default 5 menit)</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Per-Domain Control:</p>
                  <p className="text-sm text-muted-foreground">
                    Default semua domain notifikasi OFF. Untuk aktifkan:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 pl-5 list-decimal">
                    <li>Tab "Kelola Data" → Klik icon <span className="font-semibold text-foreground">Pencil (✏️)</span> di domain</li>
                    <li>Toggle "Enable Notifications" → ON (warna biru)</li>
                    <li>Save → Domain akan kirim notifikasi saat status berubah</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    Icon <span className="font-semibold text-primary">Bell (🔔)</span> = Notifikasi Aktif, 
                    Icon <span className="font-semibold text-muted-foreground">BellSlash (🔕)</span> = Notifikasi Nonaktif
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm font-semibold text-amber-600 mb-1">⚠️ Important Notes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Webhook URL harus valid dari Slack Incoming Webhooks</li>
                    <li>Notifikasi hanya kirim saat ada <span className="font-semibold">perubahan status</span> (bukan setiap check)</li>
                    <li>Cooldown mencegah spam notifikasi berulang untuk domain yang sama</li>
                    <li>Notifikasi include detail: group, tags, IP address, protocol, error message</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-semibold">
              Status Monitoring
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3 items-start">
                  <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)] mt-1 flex-shrink-0" />
                  <div className="space-y-1">
                    <div className="font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>Online</div>
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
                    <div className="font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>DNS Only</div>
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
                    <p className="text-sm font-medium pt-1" style={{ color: 'rgb(245, 158, 11)' }}>
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
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(245, 158, 11)' }}>Status "DNS Only" setelah publish:</p>
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
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(245, 158, 11)' }}>Verifikasi Manual:</p>
                  <p className="text-sm text-muted-foreground">
                    Untuk domain yang status DNS Only, <span className="font-semibold text-foreground">klik icon globe</span> untuk membuka website di tab baru. 
                    Jika website terbuka dengan baik, berarti masalahnya adalah browser security/CORS, bukan server mati. 
                    Jika muncul peringatan SSL, periksa sertifikat SSL domain tersebut.
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(245, 158, 11)' }}>Sertifikat SSL Bermasalah:</p>
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
                  <p className="text-sm font-semibold text-accent mb-1" style={{ color: 'oklch(0.70 0.18 200)' }}>Response Time 6000ms:</p>
                  <p className="text-sm text-muted-foreground">
                    Jika response time menunjukkan 6000ms, artinya koneksi timeout. 
                    Server tidak merespons dalam 6 detik. Cek apakah server overload, network lambat, atau ada blocking.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mode-monitoring">
            <AccordionTrigger className="text-sm font-semibold">
              Mode Monitoring
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2 text-foreground">Mode Auto-Refresh</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Monitoring berjalan otomatis setiap 60 detik. Status domain diperbarui secara berkala tanpa perlu intervensi manual.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Countdown timer menunjukkan waktu tersisa hingga refresh berikutnya</li>
                    <li>Progress bar visual untuk indikasi waktu</li>
                    <li>Tombol Pause/Resume untuk menghentikan sementara atau melanjutkan auto-refresh</li>
                    <li>Ideal untuk monitoring real-time dalam waktu lama</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2 text-foreground">Mode Manual Check</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Check domain sekali klik, hasil ditampilkan, kemudian langsung bisa di-export. Tidak ada auto-refresh.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Klik tombol "Check" untuk memeriksa semua domain</li>
                    <li>Hasil ditampilkan dengan ringkasan Online/DNS Only/Offline</li>
                    <li>Tombol "Export Hasil" muncul setelah check selesai</li>
                    <li>Tombol "Reset" untuk menghapus hasil dan mulai check baru</li>
                    <li>Ideal untuk audit berkala atau export data untuk laporan</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1 text-accent" style={{ color: 'oklch(0.70 0.18 200)' }}>Switch Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Tombol "Auto" / "Manual" di header untuk beralih mode kapan saja. Pilih mode sesuai kebutuhan monitoring Anda.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-monitoring">
            <AccordionTrigger className="text-sm font-semibold">
              Fitur Monitoring
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Filter Status:</span> Filter domain berdasarkan 
                    status (Semua / Online / DNS Only / Offline) untuk fokus pada domain dengan kondisi tertentu
                  </p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Search:</span> Cari domain spesifik dengan 
                    fitur pencarian real-time. Ketik URL atau bagian dari domain
                  </p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Sorting:</span> Urutkan domain secara 
                    alfabetis (Nama A-Z, Z-A) atau berdasarkan status (Online/Offline Pertama)
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Informasi Detail:</span> Setiap domain 
                    menampilkan IP address, response time, dan error message jika ada
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Quick Actions:</span> Icon globe untuk 
                    membuka website di tab baru, icon copy untuk salin URL ke clipboard
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Export Terfilter:</span> Export hanya 
                    domain yang sedang ditampilkan sesuai filter dan pencarian aktif
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-grup">
            <AccordionTrigger className="text-sm font-semibold">
              Kelola Grup Domain
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <p className="text-foreground">
                  Organisir domain ke dalam grup untuk manajemen yang lebih terstruktur.
                </p>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Buat Grup:</span> Klik "Buat Grup" di tab Grup, 
                    beri nama, deskripsi, dan pilih warna untuk identifikasi visual
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Assign Domain:</span> Tombol "Atur Grup" untuk 
                    memilih domain dan memasukkannya ke grup tertentu
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Statistik Grup:</span> Setiap grup menampilkan 
                    jumlah domain dan statistik status (Online/DNS Only/Offline) per grup
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">View & Export Grup:</span> Klik grup untuk 
                    melihat detail domain di dalamnya, export domain per grup ke CSV
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Import ke Grup:</span> Saat import CSV, 
                    bisa langsung pilih grup tujuan untuk domain yang diimport
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-tag">
            <AccordionTrigger className="text-sm font-semibold">
              Kelola Tag Domain
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <p className="text-foreground">
                  Label domain dengan tag untuk kategorisasi dan filtering lebih fleksibel. Satu domain bisa memiliki banyak tag.
                </p>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Buat Tag:</span> Klik "Buat Tag" di tab Tag, 
                    beri nama dan pilih warna untuk identifikasi
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Assign Tag:</span> Tombol "Atur Tag" untuk 
                    memilih domain dan menambahkan tag ke domain tersebut
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Filter by Tag:</span> Di tab Kelola Data, 
                    filter domain berdasarkan tag tertentu untuk edit/hapus massal
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Badge Visual:</span> Tag ditampilkan sebagai 
                    badge berwarna di setiap domain card untuk identifikasi cepat
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-kelola">
            <AccordionTrigger className="text-sm font-semibold">
              Kelola Data Domain
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <p className="text-foreground">
                  Tab khusus untuk menambah, edit, dan hapus domain. Fokus pada manajemen data.
                </p>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Tambah Domain:</span> Input URL domain baru 
                    dan klik "Tambah Domain". Sistem otomatis validasi duplikasi
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Edit Domain:</span> Klik icon pensil pada 
                    domain untuk mengubah URL. Cocok untuk koreksi typo atau perubahan domain
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Hapus Domain:</span> Klik icon trash untuk 
                    hapus satu domain, atau select multiple dan hapus massal
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Bulk Selection:</span> Checkbox untuk memilih 
                    banyak domain sekaligus, kemudian hapus semua yang dipilih
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Filter Multi-Dimensi:</span> Filter berdasarkan 
                    Grup dan Tag secara bersamaan untuk isolasi data spesifik
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-statistik">
            <AccordionTrigger className="text-sm font-semibold">
              Statistik & Analisis
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <p className="text-foreground">
                  Dashboard analitik untuk memahami performa monitoring domain secara keseluruhan.
                </p>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Ringkasan Status:</span> Diagram pie chart 
                    untuk visualisasi distribusi status Online/DNS Only/Offline
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Response Time Average:</span> Statistik 
                    rata-rata waktu respons domain untuk mengukur performa server
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Statistik per Grup:</span> Analisis performa 
                    setiap grup domain dengan perbandingan visual
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="font-mono text-accent font-semibold">•</span>
                  <p>
                    <span className="font-semibold text-foreground">Domain Bermasalah:</span> Daftar domain dengan 
                    response time tertinggi atau sering offline
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitur-export-import">
            <AccordionTrigger className="text-sm font-semibold">
              Export & Import CSV
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground pt-2">
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2 text-foreground">Export CSV</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li><span className="font-semibold text-foreground">Export Semua:</span> Tombol "Export" di header untuk export seluruh domain dengan status terkini</li>
                    <li><span className="font-semibold text-foreground">Export Terfilter:</span> Tombol muncul saat ada filter/search aktif, hanya export domain yang ditampilkan</li>
                    <li><span className="font-semibold text-foreground">Export per Grup:</span> Di view detail grup, export hanya domain dalam grup tersebut</li>
                    <li><span className="font-semibold text-foreground">Format CSV:</span> URL, Status, IP, Response Time, Error Message (jika ada)</li>
                    <li>CSV otomatis download ke browser setelah klik export</li>
                    <li>Nama file disesuaikan (monitoring-domains.csv, nama-grup.csv, dll)</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2 text-foreground">Import CSV</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Klik tombol "Import" di header, upload file CSV dengan list domain</li>
                    <li><span className="font-semibold text-foreground">Format CSV:</span> Kolom "url" atau "domain" (satu kolom saja). Header optional.</li>
                    <li>Sistem otomatis deteksi duplikasi dan skip domain yang sudah ada</li>
                    <li>Bisa pilih grup tujuan saat import untuk langsung masukkan ke grup tertentu</li>
                    <li>Preview domain sebelum import untuk validasi data</li>
                    <li>Notifikasi jumlah domain berhasil diimport</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1 text-accent" style={{ color: 'oklch(0.70 0.18 200)' }}>Tips</p>
                  <p className="text-sm text-muted-foreground">
                    Untuk Mode Manual, pastikan sudah klik "Check" sebelum export agar mendapat status terkini. 
                    Untuk Mode Auto, bisa export kapan saja karena status selalu update otomatis.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">
              ❓ FAQ (Frequently Asked Questions)
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm pt-2">
                <div className="bg-card border rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">Q: Kenapa banyak domain status "DNS Only"?</p>
                  <p className="text-muted-foreground">
                    A: Kemungkinan browser security (CORS) memblokir monitoring cross-origin, atau web server bermasalah. 
                    Klik icon globe untuk verifikasi manual ke website aslinya.
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">Q: Bagaimana cara export data monitoring?</p>
                  <p className="text-muted-foreground">
                    A: Untuk Mode Manual, klik "Check" terlebih dahulu, lalu klik "Export Hasil". 
                    Untuk Mode Auto, klik tombol "Export" kapan saja.
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">Q: Apakah bisa monitoring domain non-.kendalkab.go.id?</p>
                  <p className="text-muted-foreground">
                    A: Ya, sistem dapat memonitor domain apa saja. Tidak terbatas hanya subdomain kendalkab.go.id.
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">Q: Berapa lama timeout untuk check domain?</p>
                  <p className="text-muted-foreground">
                    A: Sistem menunggu 6 detik per domain. Jika tidak ada respons dalam 6 detik, domain dianggap timeout (status DNS Only atau Offline).
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">Q: Apakah data monitoring tersimpan otomatis?</p>
                  <p className="text-muted-foreground">
                    A: Ya, semua data (domain list, grup, tag) otomatis tersimpan di browser. 
                    Data akan tetap ada meskipun browser ditutup atau refresh halaman.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Butuh bantuan lebih lanjut? Hubungi Administrator Sistem
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
