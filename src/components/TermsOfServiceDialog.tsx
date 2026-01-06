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

export function TermsOfServiceDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          Syarat & Ketentuan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} weight="duotone" />
            Syarat & Ketentuan Layanan
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">1. Penerimaan Ketentuan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Dengan menggunakan aplikasi Domain Monitor, Anda menyetujui untuk terikat dengan syarat dan 
                ketentuan layanan ini. Jika Anda tidak setuju dengan ketentuan ini, harap tidak menggunakan 
                aplikasi ini.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">2. Tujuan Layanan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Domain Monitor adalah aplikasi monitoring untuk memantau status ketersediaan domain milik 
                Pemerintah Kabupaten Kendal. Aplikasi ini dirancang untuk penggunaan internal dan tidak 
                dimaksudkan untuk tujuan komersial.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">3. Penggunaan yang Diizinkan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Anda diizinkan untuk:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Menambahkan domain yang sah untuk keperluan monitoring</li>
                <li>Mengorganisir domain dalam grup dan tag</li>
                <li>Mengekspor data monitoring untuk keperluan pelaporan</li>
                <li>Menggunakan fitur auto-refresh untuk monitoring berkelanjutan</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">4. Penggunaan yang Dilarang</h3>
              <p className="text-muted-foreground leading-relaxed">
                Anda dilarang untuk:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Menggunakan aplikasi untuk tujuan ilegal atau tidak sah</li>
                <li>Melakukan monitoring domain tanpa izin yang sah</li>
                <li>Menggunakan aplikasi untuk serangan DDoS atau aktivitas berbahaya</li>
                <li>Memodifikasi atau merekayasa balik kode aplikasi tanpa izin</li>
                <li>Mengganggu atau merusak fungsi normal aplikasi</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">5. Tanggung Jawab Pengguna</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pengguna bertanggung jawab untuk:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Memastikan domain yang dimonitor adalah domain yang sah dan berwenang</li>
                <li>Menjaga keamanan akses ke aplikasi</li>
                <li>Menggunakan data hasil monitoring dengan bijak dan sesuai aturan</li>
                <li>Melaporkan bug atau masalah keamanan yang ditemukan</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">6. Ketersediaan Layanan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami berusaha menjaga aplikasi tetap tersedia 24/7, namun tidak menjamin bahwa layanan akan 
                selalu tersedia tanpa gangguan. Kami berhak melakukan maintenance atau update tanpa 
                pemberitahuan sebelumnya.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">7. Akurasi Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Hasil monitoring domain disediakan "sebagaimana adanya". Kami berusaha memberikan informasi 
                yang akurat, namun tidak menjamin 100% akurasi data. Status domain dapat dipengaruhi oleh 
                berbagai faktor seperti koneksi internet, CORS policy, dan konfigurasi server.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">8. Batasan Tanggung Jawab</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami tidak bertanggung jawab atas:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Kehilangan data akibat penghapusan browser cache atau storage</li>
                <li>Kesalahan dalam hasil monitoring yang disebabkan faktor eksternal</li>
                <li>Kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan aplikasi</li>
                <li>Gangguan layanan yang disebabkan oleh faktor di luar kendali kami</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">9. Perubahan Layanan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami berhak untuk memodifikasi, menangguhkan, atau menghentikan layanan (atau bagian darinya) 
                kapan saja tanpa pemberitahuan sebelumnya. Kami juga dapat memperbarui fitur atau mengubah 
                cara kerja aplikasi untuk peningkatan layanan.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">10. Hak Kekayaan Intelektual</h3>
              <p className="text-muted-foreground leading-relaxed">
                Semua hak kekayaan intelektual terkait aplikasi Domain Monitor, termasuk desain, kode, dan 
                konten, adalah milik Pemerintah Kabupaten Kendal. Penggunaan tanpa izin dilarang.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">11. Perubahan Ketentuan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kami berhak memperbarui syarat dan ketentuan ini sewaktu-waktu. Penggunaan aplikasi setelah 
                perubahan dianggap sebagai penerimaan terhadap ketentuan yang diperbarui.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">12. Hukum yang Berlaku</h3>
              <p className="text-muted-foreground leading-relaxed">
                Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di 
                Indonesia. Setiap perselisihan akan diselesaikan melalui jalur hukum yang berlaku.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-foreground">13. Kontak</h3>
              <p className="text-muted-foreground leading-relaxed">
                Untuk pertanyaan atau klarifikasi terkait syarat dan ketentuan ini, silakan hubungi 
                administrator sistem Domain Monitor Kabupaten Kendal.
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
