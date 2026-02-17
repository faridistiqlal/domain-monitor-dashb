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

interface ChangelogDialogProps {
  triggerText?: string
  showIcon?: boolean
}

export function ChangelogDialog({ triggerText, showIcon = true }: ChangelogDialogProps) {
  const [open, setOpen] = useState(false)
  const displayText = triggerText || `Changelog v${APP_VERSION}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
        >
          {showIcon && <Clock size={12} className="mr-1" />}
          {displayText}
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
            
            {/* Version 3.10.2 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.10.2</h3>
                  <p className="text-xs text-muted-foreground">Current Release • 16 Februari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-red-500 to-orange-500">Security & Deploy</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-red-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Firebase Rules Deploy & E2E Readiness</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Firestore Rules Live:</strong> Rules sudah terdeploy ke Firebase project <strong>kendal-monitor</strong> dengan compile bersih.</li>
                    <li><strong>Rules Mapping Ready:</strong> Konfigurasi <strong>firebase.json</strong> + script deploy rules berbasis <strong>firebase-tools</strong> sudah disiapkan.</li>
                    <li><strong>E2E Checklist Added:</strong> Dokumen uji nyata Firebase untuk role admin/viewer/add-only dan audit log sudah tersedia.</li>
                    <li><strong>Footer Version Sync:</strong> Footer otomatis menampilkan v3.10.2 dari source-of-truth version constant.</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />
            
            {/* Version 3.9.4 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.9.4</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500">UI Polish</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-amber-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Icon Corrections & Layout</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Folder Icon for Groups:</strong> Groups now use Folder icon instead of Tag</li>
                    <li><strong>Tag Icon for Tags:</strong> Tags correctly use Tag icon</li>
                    <li><strong>Inline Layout:</strong> Groups and tags displayed on same line as URL</li>
                    <li><strong>Visual Clarity:</strong> Easier to distinguish between groups and tags</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.9.3 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.9.3</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-red-500 to-orange-500">Critical Fix</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-red-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Groups Persistence Fix</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Firebase First:</strong> Groups now always load from Firebase (not cache)</li>
                    <li><strong>Consistent Data:</strong> Domains in groups persist correctly after refresh</li>
                    <li><strong>Monitoring Tab Fix:</strong> Groups now display correctly in monitoring tab</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.9.2 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.9.2</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">UI Consistency</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-purple-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Dropdown Menu di Tag Card</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Consistent UI:</strong> Tombol Edit dan Hapus sekarang dalam dropdown menu (...)</li>
                    <li><strong>Cleaner Design:</strong> Konsisten dengan GroupCard dan PinnedDomainCard</li>
                    <li><strong>Better UX:</strong> Lebih rapi dan hemat space di card</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.9.1 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.9.1</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500">UI Polish</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Dropdown Menu di Pinned Card</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Unified UI:</strong> Tombol di dalam dropdown menu seperti GroupCard</li>
                    <li><strong>Menu Items:</strong> "Buka di tab baru" dan "Unpin domain"</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.9.0 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.9.0</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-blue-500">New Feature</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={16} className="text-green-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Search di Assign Domains Dialog</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Search Box:</strong> Real-time filtering saat mengetik</li>
                    <li><strong>Smart Counter:</strong> Update sesuai hasil filter</li>
                    <li><strong>Select All:</strong> Bekerja dengan filtered domains</li>
                    <li><strong>Empty State:</strong> Pesan "Tidak ada domain yang cocok"</li>
                    <li><strong>Why:</strong> Mengelola 300+ domain jadi jauh lebih mudah</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.8.9 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.8.9</h3>
                  <p className="text-xs text-muted-foreground">12 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-red-500 to-orange-500">Critical Fix</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-red-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Tag Persistence Bug Fix</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Problem:</strong> Tags hilang setelah refresh page</li>
                    <li><strong>Root Cause:</strong> localStorage key mismatch (save: domain-tags, load: tags-cache)</li>
                    <li><strong>Solution:</strong> Always load tags from Firebase first, immediate cache saves</li>
                    <li><strong>Also Fixed:</strong> Tag assignments, groups, group assignments persistence</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.5.1 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.5.1</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500">Mobile Polish</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-purple-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Mobile UX Refinements</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Check Selesai Box:</strong> 40% space saving dengan compact layout, icon 6x6, stats hanya angka + dot warna</li>
                    <li><strong>Stats Bar:</strong> 2-row responsive layout mobile, simplified text format</li>
                    <li><strong>Domain Card:</strong> Globe & Copy icons restored, full width URL</li>
                    <li><strong>Footer:</strong> Center alignment, version di Changelog button</li>
                    <li><strong>Tab Kelola:</strong> 2-row layout, semua action icons visible (Play, Edit, Pin, Delete)</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Technical</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Touch targets 36px (h-9 w-9) untuk iOS compliance</li>
                    <li>flex-col md:flex-row pattern untuk responsive</li>
                    <li>Better visual hierarchy & spacing</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.5.0 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.5.0</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-blue-500">Mobile Responsive</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket size={16} className="text-green-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Major Features</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Hamburger Menu:</strong> Sheet drawer navigation untuk mobile dengan touch-friendly spacing</li>
                    <li><strong>Responsive Tabs:</strong> 3-column grid mobile (h-11), 6-column desktop</li>
                    <li><strong>DomainCard Touch Targets:</strong> 40px minimum, responsive icons 18px mobile / 16px desktop</li>
                    <li><strong>Three-dot Dropdown:</strong> Mobile menu untuk actions (Copy, Open, Pin, Stats, Delete)</li>
                    <li><strong>Info Hasil Layout:</strong> Color-coded dots, vertical mobile / horizontal desktop</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Technical</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Breakpoint md: 768px untuk mobile/desktop split</li>
                    <li>grid-cols-3 md:grid-cols-6 pattern</li>
                    <li>iOS/Android touch target compliance</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Version 3.4.3 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.4.3</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive" className="text-xs">Cache Fix</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fix</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Cache Reset Issue:</strong> Fixed localStorage cache masih punya enabled:true setelah pause. Icon Pause (||) sekarang benar-benar reset ke Play (▶️) setelah refresh.</li>
                    <li>Reset enabled field di 3 tempat: cache load, Firebase load, background refresh</li>
                    <li>Consistent behavior di semua load scenario</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Technical</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Reset enabled saat JSON.parse dari localStorage</li>
                    <li>Icon selalu akurat reflect monitoring state</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.4.2</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive" className="text-xs">UX Fix</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fix</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Individual Monitoring Reset:</strong> Fixed icon Pause (||) masih tampil setelah refresh padahal monitoring tidak berjalan.</li>
                    <li>Auto-reset enabled field ke false saat page load</li>
                    <li>Individual monitoring sekarang bersifat temporary (tidak persistent)</li>
                    <li>User harus klik Play lagi setelah refresh</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Design Decision</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Individual monitoring = on-demand troubleshooting (temporary)</li>
                    <li>Refresh = reset state untuk predictable UX</li>
                    <li>Untuk persistent monitoring, gunakan Auto-Check global</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.4.1</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive" className="text-xs">Critical Fix</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fix</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Pin Tab Firebase Sync:</strong> Fixed pin/unpin tidak tersimpan di Firebase. Domain yang di-pin di device A sekarang langsung sync ke device B.</li>
                    <li>Immediate sync saat pin/unpin domain dengan explicit logging</li>
                    <li>Toast message updated untuk transparansi: "disinkronkan"</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Technical</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Direct call syncDomainsToFirestore() saat toggle pin</li>
                    <li>Async/await pattern untuk ensure sync completes</li>
                    <li>Konsisten dengan Group & Tag sync behavior</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.4.0</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">Major Feature</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={16} className="text-green-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Fitur Baru</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Tab Pin - Favorite Domains:</strong> Tab khusus untuk domain favorit dengan visualisasi uptime 90 hari. Pin/unpin domain dengan icon MapPin, auto-check saat tab dibuka, refresh manual dengan tombol, tampilan compact dengan status real-time.</li>
                    <li><strong>Uptime Bar Visualization:</strong> Bar chart 90 hari di setiap pinned domain card. Warna green (95%+), yellow (80-95%), orange (50-80%), red (&lt;50%), hover untuk detail per hari.</li>
                    <li><strong>Firebase Query Optimization:</strong> In-memory sorting untuk uptime data, hindari composite index requirement, performa lebih cepat tanpa Firebase index creation.</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fixes</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Fixed ReferenceError saat auto-check pinned domains</li>
                    <li>Fixed Firebase composite index error di uptime query</li>
                    <li>Fixed last check timestamp tidak muncul di Pin tab</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.2.3</h3>
                  <p className="text-xs text-muted-foreground">8 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">UX Improvement</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={16} className="text-green-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Fitur Baru</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li><strong>Auto-Clear Status on Refresh:</strong> Status counts otomatis terhapus saat browser refresh untuk mencegah kebingungan dengan data lama</li>
                    <li><strong>Clear Status Banner:</strong> Tampilan "Belum Ada Data Status" yang informatif setelah refresh</li>
                    <li><strong>Search in Firebase Analytics:</strong> Tambah fitur pencarian domain di tab Firebase Analytics</li>
                    <li><strong>Unlimited Domain List:</strong> Hapus limit tampilan 50/100 domain, sekarang tampilkan semua domain tanpa batas</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={16} className="text-yellow-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Bug Fixes</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Fixed chart button tidak bisa diklik di tab Kelola Data</li>
                    <li>Fixed status counts menampilkan data lama setelah browser refresh</li>
                    <li>Fixed domain list hanya menampilkan 50-100 dari 200+ domain yang ada</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-blue-500" weight="duotone" />
                    <h4 className="text-sm font-semibold text-foreground">Improvements</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>UX: Hapus tombol chart dari tab Manage (redundant dengan tab Statistik)</li>
                    <li>UX: Localization - "View statistics" → "Lihat statistik"</li>
                    <li>Performance: ScrollArea dapat handle 200-400 domain dengan smooth scrolling</li>
                    <li>Clarity: User harus manual check setelah refresh untuk data real-time</li>
                  </ul>
                </div>
              </div>
              
              <Separator />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Version 3.1.2</h3>
                  <p className="text-xs text-muted-foreground">7 Januari 2026</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Individual Monitoring</Badge>
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
