import { useState } from 'react'
import { FileText } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function PrivacyPolicyDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          Kebijakan Privasi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} weight="duotone" />
            Kebijakan Privasi
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">1. Pengumpulan Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Domain Monitor mengumpulkan dan menyimpan data domain yang Anda tambahkan ke sistem monitoring. 
                Data ini disimpan secara lokal di browser Anda menggunakan teknologi penyimpanan lokal dan tidak 
                dikirim ke server eksternal kecuali untuk keperluan pemeriksaan status domain.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">2. Penggunaan Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Data yang dikumpulkan digunakan untuk:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Memantau status domain yang telah Anda daftarkan</li>
                <li>Menyediakan laporan dan statistik monitoring</li>
                <li>Mengorganisir domain dalam grup dan tag</li>
                <li>Mengekspor data monitoring ke format CSV</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">3. Penyimpanan Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Semua data disimpan secara lokal di perangkat Anda. Data tidak diunggah ke server pusat atau 
                dibagikan dengan pihak ketiga. Penghapusan data browser atau cache akan menghapus semua data 
                monitoring yang tersimpan.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">4. Keamanan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami mengambil langkah-langkah keamanan yang wajar untuk melindungi data Anda. Namun, karena 
                data disimpan secara lokal di browser, keamanan data bergantung pada keamanan perangkat Anda.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">5. Pemeriksaan Domain</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ketika melakukan pemeriksaan domain, aplikasi akan mengirim request ke domain yang bersangkutan 
                untuk memeriksa status ketersediaannya. Proses ini mungkin dicatat oleh server domain yang diperiksa 
                sebagai akses normal.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">6. Ekspor Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Fitur ekspor CSV memungkinkan Anda mengunduh data monitoring dalam format yang dapat dibaca. 
                Data yang diekspor hanya tersimpan di perangkat lokal Anda dan tidak dikirim ke server.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">7. Hak Pengguna</h3>
              <p className="text-muted-foreground leading-relaxed">
                Anda memiliki kontrol penuh atas data Anda dan dapat:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Menambahkan atau menghapus domain kapan saja</li>
                <li>Mengekspor data monitoring Anda</li>
                <li>Menghapus semua data dengan membersihkan penyimpanan browser</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">8. Perubahan Kebijakan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami berhak memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan ditampilkan pada 
                halaman ini dengan tanggal pembaruan yang tercantum.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">9. Kontak</h3>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi administrator 
                sistem Domain Monitor Kabupaten Kendal.
              </p>
            </section>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Terakhir diperbarui: Januari 2024
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
