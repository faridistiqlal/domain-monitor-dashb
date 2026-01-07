import { useState } from 'react'
import { Clock, Sparkle, Palette, Rocket, Bug, ChartBar, Wrench, Compass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { APP_VERSION } from '@/lib/version'

export function ChangelogDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock size={12} className="mr-1" />
          Changelog v{APP_VERSION}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            Changelog
          </DialogTitle>
          <DialogDescription>
            Riwayat update dan perkembangan aplikasi Domain Monitor
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.1.2</h3>
                  <p className="text-xs text-muted-foreground">Current Release • 7 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">Individual Monitoring</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={16} className="text-green-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Fitur Baru</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Individual Domain Monitoring:</strong> Play/Pause button per domain untuk continuous monitoring (independen dari global mode)</li>
                    <li><strong>Smart Interval:</strong> Check setiap 5 menit = 288 checks/day per domain (optimal untuk grafik 24 jam)</li>
                    <li><strong>Domain Statistics Dialog:</strong> Klik icon chart untuk lihat uptime %, response time trends, dan incidents per domain</li>
                    <li><strong>Auto Firebase Sync:</strong> Data individual monitoring otomatis masuk Firebase collection untuk analytics</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fixes</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Fixed Firebase undefined values error saat sync domains</li>
                    <li>Fixed individual monitoring interval closure staleness issue</li>
                    <li>Fixed enabled field persistence saat page refresh</li>
                    <li>Fixed background refresh overwrite enabled state</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Improvements</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Optimized monitoring interval: 2 menit → 5 menit (4x lebih efisien Firebase quota)</li>
                    <li>Improved state management untuk enabled field di Firebase listener</li>
                    <li>Better console logging untuk debugging monitoring flow</li>
                  </ul>
                </div>
              </div>
              
              <Separator />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.0.1</h3>
                  <p className="text-xs text-muted-foreground">7 Januari 2026</p>
                </div>
                <Badge className="bg-primary text-primary-foreground">Latest</Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center">
                      <Rocket size={14} weight="duotone" className="text-green-600 dark:text-green-500" />
                    </div>
                    Firebase Optimization
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                      <span><strong className="text-foreground">Statistics Loading:</strong> Optimized dengan collection queries (12,000 → 400 reads)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                      <span><strong className="text-foreground">Write Batching:</strong> Bulk status updates untuk mengurangi network overhead</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                      <span><strong className="text-foreground">Auto-Cleanup:</strong> Stats {'>'}30 hari otomatis terhapus daily</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                      <span><strong className="text-foreground">Operation Tracking:</strong> Monitor Firebase usage real-time (dev mode)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                      <span><strong className="text-foreground">Efficiency:</strong> ~3,500 ops/day untuk 400 domain (under 20k free tier limit)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.0.0</h3>
                  <p className="text-xs text-muted-foreground">7 Januari 2026</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                      <Sparkle size={14} weight="duotone" className="text-accent" />
                    </div>
                    Fitur Baru
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">GitHub Repository Integration:</strong> Code backup otomatis di GitHub dengan full version control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Auto-Deploy System:</strong> Vercel otomatis deploy setiap kali git push ke repository</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Version Control:</strong> Full Git history dengan kemampuan rollback dan branch management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Collaboration Ready:</strong> Team dapat clone, fork, dan kontribusi melalui Pull Request</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-yellow-500/20 flex items-center justify-center">
                      <Wrench size={14} weight="duotone" className="text-yellow-600 dark:text-yellow-500" />
                    </div>
                    Peningkatan
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-500 mt-1">•</span>
                      <span><strong className="text-foreground">CI/CD Pipeline:</strong> Deployment otomatis dengan build verification dan status checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-500 mt-1">•</span>
                      <span><strong className="text-foreground">Data Safety:</strong> Code tersimpan aman di GitHub, tidak lagi bergantung pada Codespace saja</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-500 mt-1">•</span>
                      <span><strong className="text-foreground">Development Workflow:</strong> Edit → Commit → Push → Auto-deploy (1-2 menit)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 2.2.0</h3>
                  <p className="text-xs text-muted-foreground">7 Januari 2026</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                      <Sparkle size={14} weight="duotone" className="text-accent" />
                    </div>
                    Fitur Baru
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Slack Webhook Notifications:</strong> Integrasi notifikasi ke Slack channel saat domain down/recovery/slow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Per-Domain Notification Control:</strong> Enable/disable notifikasi per domain secara individual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Enhanced Notification Details:</strong> Notifikasi mencakup group, tags, IP address, protocol, error details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Notification Settings Dialog:</strong> Konfigurasi webhook URL, aturan notifikasi, dan cooldown period</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Notification Indicator:</strong> Icon Bell/BellSlash di management list untuk status notifikasi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Test Notification:</strong> Tombol test untuk memastikan webhook bekerja sebelum digunakan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Cooldown System:</strong> Anti-spam dengan cooldown 5 menit antar notifikasi per domain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Flexible Domain Validation:</strong> Mendukung root domain (kendalkab.go.id) dan subdomain</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <Palette size={14} weight="duotone" className="text-primary" />
                    </div>
                    Peningkatan UI/UX
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Bell Icon Header:</strong> Tombol notifikasi di header untuk akses cepat settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Visual Notification Status:</strong> Icon Bell (active) dan BellSlash (inactive) dengan tooltip</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Notification Toggle in Edit:</strong> Switch enable/disable notifikasi di EditDomainDialog</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Comprehensive Help:</strong> Panduan lengkap setup Slack webhook di InfoDialog</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-success/20 flex items-center justify-center">
                      <Rocket size={14} weight="duotone" className="text-success" />
                    </div>
                    Peningkatan Performa
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">No-CORS Webhook Calls:</strong> Webhook requests berjalan dari browser tanpa CORS issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">NotificationService Class:</strong> Arsitektur service dengan Map-based cooldown tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Smart Status Detection:</strong> Notifikasi hanya saat status change, bukan setiap check</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-destructive/20 flex items-center justify-center">
                      <Bug size={14} weight="duotone" className="text-destructive" />
                    </div>
                    Bug Fixes
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: CORS error saat webhook request dengan no-cors mode</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Cooldown blocking test notifications dengan clearCooldown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Domain validation menolak root domain (kendalkab.go.id)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: EditDomainDialog syntax error (DialogDescription typo)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 2.1.0</h3>
                  <p className="text-xs text-muted-foreground">6 Januari 2026</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                      <Sparkle size={14} weight="duotone" className="text-accent" />
                    </div>
                    Fitur Baru
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Firebase Cloud Sync:</strong> Data domain, grup, dan tag otomatis tersimpan di cloud Firebase Firestore</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Cross-Device Support:</strong> Buka aplikasi di PC, data yang sama muncul di tablet/HP secara real-time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Hybrid Storage:</strong> Kombinasi Firebase (cloud) + localStorage (offline) untuk reliability maksimal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Password Authentication:</strong> Login dengan password untuk membatasi akses edit dan delete</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Auto-Logout Timer:</strong> Sistem otomatis logout setelah 30 menit tidak ada aktivitas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Change Password Dialog:</strong> Dialog untuk mengganti password admin dari aplikasi</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <Palette size={14} weight="duotone" className="text-primary" />
                    </div>
                    Peningkatan UI/UX
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Logo Optimasi:</strong> Logo dikonversi dari PNG (105KB) ke WebP (26KB) - hemat 75%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Favicon Transparent:</strong> Favicon PNG 32x32 dengan background transparan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Loading State:</strong> Indikator loading saat data sedang dimuat dari Firebase</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Login Dialog:</strong> Modal login dengan password input (show/hide toggle)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Settings Dialog:</strong> Modal untuk ubah password dengan validasi minimal 6 karakter</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-success/20 flex items-center justify-center">
                      <Rocket size={14} weight="duotone" className="text-success" />
                    </div>
                    Peningkatan Performa
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Firestore Real-time Sync:</strong> Perubahan data di satu device langsung ter-update di device lain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Automatic Sync:</strong> Data otomatis di-sync ke Firebase setiap kali ada perubahan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Fallback Mechanism:</strong> Jika Firebase error, aplikasi fallback ke localStorage</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-destructive/20 flex items-center justify-center">
                      <Bug size={14} weight="duotone" className="text-destructive" />
                    </div>
                    Bug Fixes
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Data tidak sync antar device (sebelumnya hanya localStorage)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Logo dan favicon tidak muncul (URL external blocked)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Favicon stretched karena aspect ratio salah</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 2.0.0</h3>
                  <p className="text-xs text-muted-foreground">2024</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                      <Sparkle size={14} weight="duotone" className="text-accent" />
                    </div>
                    Fitur Baru
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Tab Statistik:</strong> Visualisasi data monitoring dengan chart dan analisis mendalam</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Sistem Tag:</strong> Organisir domain dengan multiple tags per domain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Mode Manual Check:</strong> Opsi untuk check domain sekali klik tanpa auto-refresh</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Export Terfilter:</strong> Export domain berdasarkan filter dan grup aktif</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Multi-Select Delete:</strong> Hapus banyak domain sekaligus di tab Kelola Data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Edit Domain:</strong> Edit URL domain langsung dari tab Kelola Data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span><strong className="text-foreground">Filter by Group & Tag:</strong> Filter domain berdasarkan grup atau tag</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <Palette size={14} weight="duotone" className="text-primary" />
                    </div>
                    Peningkatan UI/UX
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Virtualized List:</strong> Optimasi performa rendering untuk ratusan domain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Scroll Area Fixed:</strong> Header tetap di atas saat scroll list domain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Copy URL:</strong> Klik URL domain untuk langsung copy ke clipboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Status Indicators:</strong> Glow effect pada status online/offline/DNS only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Clear Status Button:</strong> Reset hasil check manual dengan mudah</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-success/20 flex items-center justify-center">
                      <Rocket size={14} weight="duotone" className="text-success" />
                    </div>
                    Peningkatan Performa
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Debounced Search:</strong> Search lebih smooth dengan delay 300ms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Lazy Loading:</strong> Render domain secara bertahap untuk performa optimal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span><strong className="text-foreground">Optimized Filtering:</strong> Filter dan sort lebih cepat dengan memoization</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-destructive/20 flex items-center justify-center">
                      <Bug size={14} weight="duotone" className="text-destructive" />
                    </div>
                    Bug Fixes
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Export CSV tidak terdownload di browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Font color hitam setelah publish</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: CSS tidak terbaca di production</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Checkbox outline terpotong di Kelola Data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>Fixed: Filter dan search mengalami lag dengan 300+ domain</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
                      <ChartBar size={14} weight="duotone" className="text-amber-500" />
                    </div>
                    Data & Export
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Export semua domain ke CSV</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Export domain per grup ke CSV</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Export domain terfilter ke CSV</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Import domain dari CSV dengan grup assignment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Status monitoring: Online, DNS Only, Offline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Response time tracking per domain</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                      <Wrench size={14} weight="duotone" className="text-muted-foreground" />
                    </div>
                    Fitur Teknis
                  </div>
                  <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Auto-refresh setiap 60 detik (bisa di-pause)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Manual check on-demand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Persistent data dengan KV storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Real-time status updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Domain validation dan duplicate checking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Version 1.0.0</h3>
                <p className="text-xs text-muted-foreground">Initial Release • 2023</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                    <Sparkle size={14} weight="duotone" className="text-accent" />
                  </div>
                  Fitur Awal
                </div>
                <ul className="space-y-1.5 ml-8 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Domain monitoring dasar dengan status online/offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Auto-refresh monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Import/Export CSV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Sistem grup domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Filter dan search domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Dashboard monitoring real-time</span>
                  </li>
                </ul>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Compass size={20} weight="duotone" className="text-primary" />
                Roadmap
              </h3>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Fitur Mendatang</p>
                <ul className="space-y-1.5 ml-4 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Historical Data:</strong> Track perubahan status domain dari waktu ke waktu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Alert Notifications:</strong> Notifikasi ketika domain down</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Uptime Percentage:</strong> Hitung persentase uptime per domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Bulk Operations:</strong> Import/export dengan lebih banyak format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Advanced Analytics:</strong> Lebih banyak insight dan visualisasi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">API Integration:</strong> Webhook dan API untuk integrasi external</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Custom Check Interval:</strong> Atur interval check per domain atau grup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">SSL Certificate Monitoring:</strong> Check status SSL certificate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong className="text-foreground">Multi-User Support:</strong> Kolaborasi team dengan role management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
