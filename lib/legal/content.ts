/**
 * Text of the Kebijakan Privasi and Syarat & Ketentuan pages. Written to
 * match what the product actually does (see the comments next to each
 * claim); change the text here when the product changes. The product owner
 * should have both reviewed by someone qualified in Indonesian law before
 * launch (D-106).
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocument {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

export const BRAND = "Digital Invitation";
export const LEGAL_EFFECTIVE_DATE = "4 November 2026";

export const PRIVACY_POLICY: LegalDocument = {
  title: "Kebijakan Privasi",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro: `Kebijakan ini menjelaskan data apa yang dikumpulkan ${BRAND}, untuk apa data itu dipakai, dan apa saja hakmu atas data tersebut, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.`,
  sections: [
    {
      heading: "Data yang kami kumpulkan",
      items: [
        "Data akun pemilik acara: nama, alamat email, dan kata sandi. Kata sandi disimpan dalam bentuk terenkripsi oleh penyedia layanan autentikasi kami dan tidak pernah dapat kami lihat.",
        "Data acara yang kamu buat: judul, jadwal, lokasi, nama dan foto mempelai atau tuan rumah, nama orang tua, kisah, galeri foto, musik latar, serta informasi rekening atau alamat untuk hadiah.",
        "Data tamu yang kamu masukkan: nama, nomor telepon, email, kategori, kuota kursi, dan catatan.",
        "Data dari tamu undangan: jawaban RSVP, jumlah orang yang hadir, pesan untuk tuan rumah, ucapan dan doa, serta waktu check-in di lokasi acara.",
        "Data teknis: alamat IP yang dipakai sementara untuk membatasi percobaan berlebihan (misalnya percobaan masuk), catatan galat server tanpa token undangan tamu, serta statistik kunjungan undangan berupa penanda kunjungan anonim, jenis perangkat (ponsel, tablet, atau komputer), dan sumber kunjungan.",
      ],
    },
    {
      heading: "Peran kami atas data tamu",
      paragraphs: [
        "Untuk data tamu, pemilik acara adalah pihak yang menentukan data apa yang dimasukkan dan untuk tujuan apa. Kami memproses data tersebut atas nama pemilik acara agar undangan, RSVP, ucapan, dan check-in dapat berjalan.",
        "Pemilik acara bertanggung jawab memastikan tamu bersedia datanya dipakai untuk keperluan undangan.",
      ],
    },
    {
      heading: "Untuk apa data dipakai",
      items: [
        "Menampilkan undangan, termasuk sapaan pribadi untuk setiap tamu.",
        "Menerima dan menampilkan RSVP, ucapan, serta mencatat check-in tamu.",
        "Menampilkan statistik undangan kepada pemilik acara.",
        "Menjaga keamanan layanan, mencegah penyalahgunaan, dan memperbaiki galat.",
        "Menghubungimu terkait akun, misalnya konfirmasi pendaftaran dan atur ulang kata sandi.",
      ],
      paragraphs: [
        "Kami tidak menjual data pribadi dan tidak memakainya untuk iklan pihak ketiga.",
      ],
    },
    {
      heading: "Siapa yang dapat melihat data",
      items: [
        "Undangan yang dipublikasikan dapat dibuka oleh siapa pun yang memiliki tautannya. Undangan tidak kami daftarkan ke mesin pencari.",
        "Nama tamu dan formulir RSVP pribadi hanya muncul melalui tautan undangan pribadi tamu tersebut.",
        "Daftar tamu, jawaban RSVP, dan statistik hanya dapat dilihat oleh pemilik acara dan anggota yang diundang ke acara tersebut.",
        "Ucapan tamu tampil di undangan setelah disetujui pemilik acara.",
      ],
    },
    {
      heading: "Penyedia layanan yang kami gunakan",
      paragraphs: [
        "Kami memakai penyedia layanan untuk menjalankan aplikasi: Supabase untuk basis data, penyimpanan file, dan autentikasi; serta Vercel untuk hosting aplikasi. Mereka memproses data hanya untuk menjalankan layanan kami. Server penyedia tersebut dapat berada di luar Indonesia.",
      ],
    },
    {
      heading: "Cookie",
      paragraphs: [
        "Kami memakai cookie yang diperlukan agar kamu tetap masuk ke akunmu, serta satu cookie anonim di halaman undangan untuk menghitung kunjungan unik (berlaku 90 hari). Kami tidak memakai cookie iklan atau pelacak pihak ketiga.",
      ],
    },
    {
      heading: "Berapa lama data disimpan",
      paragraphs: [
        "Data disimpan selama akunmu aktif. Saat kamu menghapus acara, data acara beserta tamu, RSVP, dan ucapannya ikut terhapus. Saat kamu menghapus akun melalui menu Akun, semua acara milikmu, file yang kamu unggah, dan data loginmu dihapus.",
        "Catatan aktivitas keamanan (misalnya kapan sebuah acara dihapus) dapat kami simpan tanpa tautan ke identitasmu untuk keperluan keamanan. Catatan pembayaran, bila ada, disimpan sesuai kewajiban hukum.",
      ],
    },
    {
      heading: "Hakmu",
      items: [
        "Mengakses dan memperbaiki data akun serta acaramu langsung dari dashboard.",
        "Menghapus akun beserta datanya melalui menu Akun.",
        "Meminta salinan data atau menyampaikan keberatan atas pemrosesan data dengan menghubungi kami.",
        "Tamu undangan dapat meminta pemilik acara atau kami untuk menghapus datanya.",
      ],
    },
    {
      heading: "Keamanan",
      paragraphs: [
        "Koneksi ke layanan kami dienkripsi (HTTPS). Akses ke data acara dibatasi untuk pemilik dan anggota acara, dan setiap tautan undangan pribadi memakai kode acak yang tidak dapat ditebak. Tidak ada sistem yang sepenuhnya kebal, jadi jagalah kerahasiaan kata sandi dan tautan pribadimu.",
      ],
    },
    {
      heading: "Perubahan kebijakan",
      paragraphs: [
        "Kebijakan ini dapat kami perbarui. Tanggal berlaku di atas halaman ini akan berubah, dan untuk perubahan penting kami akan memberi tahu pemilik akun.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Syarat & Ketentuan",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro: `Dengan membuat akun atau memakai ${BRAND}, kamu menyetujui syarat berikut. Mohon dibaca dengan saksama.`,
  sections: [
    {
      heading: "Akun",
      items: [
        "Gunakan nama dan email yang benar, dan jaga kerahasiaan kata sandimu.",
        "Kamu bertanggung jawab atas aktivitas yang terjadi melalui akunmu.",
        "Kamu dapat menghapus akunmu kapan saja melalui menu Akun.",
      ],
    },
    {
      heading: "Layanan dan biaya",
      paragraphs: [
        "Selama masa awal ini semua fitur dapat dipakai tanpa biaya. Paket berbayar akan diumumkan kemudian dengan harga dan syarat yang jelas, dan tidak ada tagihan yang dikenakan tanpa persetujuanmu.",
      ],
    },
    {
      heading: "Konten milikmu",
      items: [
        "Kamu tetap memiliki konten yang kamu unggah, seperti teks, foto, dan musik.",
        "Kamu menjamin berhak memakai konten tersebut, termasuk hak cipta foto dan lagu yang kamu unggah sebagai musik latar.",
        "Kamu memberi kami izin terbatas untuk menyimpan dan menampilkan konten itu semata-mata untuk menjalankan undanganmu.",
      ],
    },
    {
      heading: "Data tamu",
      paragraphs: [
        "Saat memasukkan data tamu, kamu bertanggung jawab memastikan tamu bersedia datanya dipakai untuk undangan, dan memakai data itu hanya untuk keperluan acaramu. Lihat Kebijakan Privasi untuk rincian pemrosesan data.",
      ],
    },
    {
      heading: "Penggunaan yang dilarang",
      items: [
        "Konten yang melanggar hukum, menyesatkan, mengandung kebencian, atau melanggar hak orang lain.",
        "Memakai undangan untuk penipuan, termasuk mencantumkan rekening hadiah palsu.",
        "Mengirim spam atau memakai data tamu untuk keperluan di luar acara.",
        "Mengganggu, membobol, atau membebani sistem kami secara berlebihan.",
      ],
    },
    {
      heading: "Amplop digital",
      paragraphs: [
        "Fitur hadiah hanya menampilkan informasi rekening atau alamat yang kamu masukkan. Kami tidak memproses, menyimpan, atau menjamin transfer antara tamu dan pemilik acara.",
      ],
    },
    {
      heading: "Ketersediaan layanan",
      paragraphs: [
        "Kami berusaha menjaga layanan tetap berjalan dengan baik, tetapi tidak dapat menjamin layanan selalu tersedia tanpa gangguan. Pemeliharaan atau gangguan dari penyedia layanan dapat terjadi sewaktu-waktu.",
      ],
    },
    {
      heading: "Penangguhan dan penghentian",
      paragraphs: [
        "Kami dapat menangguhkan atau menghapus akun atau undangan yang melanggar syarat ini. Bila memungkinkan, kami akan memberi tahu alasannya terlebih dahulu.",
      ],
    },
    {
      heading: "Batasan tanggung jawab",
      paragraphs: [
        "Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari pemakaian layanan, termasuk kesalahan isi undangan yang dimasukkan pengguna atau transaksi hadiah antara tamu dan pemilik acara.",
      ],
    },
    {
      heading: "Hukum yang berlaku",
      paragraphs: ["Syarat ini tunduk pada hukum Republik Indonesia."],
    },
    {
      heading: "Perubahan syarat",
      paragraphs: [
        "Syarat ini dapat kami perbarui. Tanggal berlaku di atas halaman ini akan berubah, dan untuk perubahan penting kami akan memberi tahu pemilik akun.",
      ],
    },
  ],
};

/** The public contact email, from NEXT_PUBLIC_CONTACT_EMAIL; null when it is not set. */
export function legalContactEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return email && email.includes("@") ? email : null;
}
