import { useState } from 'react'
import { Question } from '@phosphor-icons/react'
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

interface FAQDialogProps {
  triggerText?: string
}

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Apa itu Domain Monitor?',
    answer: 'Domain Monitor adalah dashboard untuk memantau ketersediaan (availability) dan uptime subdomain milik Kabupaten Kendal secara real-time. Sistem ini mengecek apakah domain online, hanya DNS, atau offline.',
  },
  {
    question: 'Bagaimana cara kerja monitoring?',
    answer: 'Monitoring dilakukan secara otomatis setiap 1 jam melalui GitHub Actions. Setiap domain diperiksa status HTTP-nya dan dicatat hasilnya (online, dns-only, atau offline). Anda juga bisa melakukan pengecekan manual kapan saja.',
  },
  {
    question: 'Apa arti status domain?',
    answer: 'Online (hijau): Domain aktif dan dapat diakses. DNS Only (kuning): Domain terdaftar di DNS tapi server tidak merespons HTTP. Offline (merah): Domain tidak dapat diakses sama sekali.',
  },
  {
    question: 'Siapa yang bisa mengakses dashboard?',
    answer: 'Hanya pengguna terdaftar yang bisa login. Ada 3 role: Admin (akses penuh termasuk kelola user), Add-Only (bisa menambah domain), dan Viewer (hanya melihat data).',
  },
  {
    question: 'Bagaimana cara menambah domain baru?',
    answer: 'Setelah login sebagai Admin atau Add-Only, buka tab Monitoring lalu gunakan form "Tambah Domain" di bagian atas. Masukkan URL domain lengkap (contoh: https://example.kendalkab.go.id).',
  },
  {
    question: 'Apakah data monitoring tersimpan?',
    answer: 'Ya. Semua data disimpan di Firebase Firestore dan tersinkronisasi antar perangkat. Statistik harian, incident, dan histori status tersimpan secara permanen.',
  },
  {
    question: 'Apa itu fitur Pin?',
    answer: 'Pin memungkinkan Anda menandai domain penting agar muncul di tab Pin untuk akses cepat. Status pin disinkronkan antar perangkat melalui Firebase.',
  },
  {
    question: 'Bagaimana notifikasi Slack bekerja?',
    answer: 'Admin bisa mengkonfigurasi webhook Slack di Settings > Notifications. Notifikasi dikirim otomatis saat domain down, recovery, atau respons lambat. Tersedia cooldown untuk mencegah spam.',
  },
  {
    question: 'Apa itu Group dan Tag?',
    answer: 'Group mengelompokkan domain berdasarkan kategori (misal: OPD, Kecamatan). Tag memberikan label fleksibel untuk filter dan organisasi. Keduanya tersinkronisasi ke Firebase.',
  },
  {
    question: 'Bagaimana cara export data?',
    answer: 'Gunakan tombol Export CSV di toolbar. Anda bisa export semua domain, domain yang terfilter, atau per group. File CSV berisi URL, status, response time, dan informasi lainnya.',
  },
]

export function FAQDialog({ triggerText = 'FAQ' }: FAQDialogProps) {
  const [open, setOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Question size={20} weight="duotone" />
            Frequently Asked Questions
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-1">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground pr-4">
                    {item.question}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
