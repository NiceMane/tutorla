/* Profil alanlarının önerileri.
   Hepsi ÖNERİ: alanlar <datalist> ile besleniyor, kullanıcı listede olmayanı
   da yazabiliyor. Önceki hâlde <select> vardı ve listede olmayan öğrenci
   (ör. hazırlık sınıfı, açıköğretim, listede olmayan şehir) alanı hiç
   dolduramıyordu. */

export const GRADE_KEYS = ["5", "6", "7", "8", "9", "10", "11", "12", "hazirlik", "mezun", "universite"] as const;
export const STYLE_KEYS = ["sabah", "gece", "karma", "haftasonu", "araliklı"] as const;
export const TRACK_KEYS = ["sayisal", "esit", "sozel", "dil"] as const;

/* 81 il — şehir alanı serbest metin ama yazarken tamamlansın. */
export const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
  "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik",
  "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
  "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
  "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis",
  "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
  "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
  "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];

/* Sık yazılan üniversiteler — liste kapalı değil, yalnızca hızlandırıcı. */
export const UNIVERSITIES = [
  "Boğaziçi Üniversitesi", "Orta Doğu Teknik Üniversitesi", "İstanbul Teknik Üniversitesi",
  "Hacettepe Üniversitesi", "Ankara Üniversitesi", "İstanbul Üniversitesi",
  "Koç Üniversitesi", "Sabancı Üniversitesi", "Bilkent Üniversitesi",
  "Galatasaray Üniversitesi", "Yıldız Teknik Üniversitesi", "Marmara Üniversitesi",
  "Gazi Üniversitesi", "Ege Üniversitesi", "Dokuz Eylül Üniversitesi",
  "İzmir Yüksek Teknoloji Enstitüsü", "Çukurova Üniversitesi", "Akdeniz Üniversitesi",
  "Erciyes Üniversitesi", "Uludağ Üniversitesi", "Anadolu Üniversitesi",
  "Karadeniz Teknik Üniversitesi", "Atatürk Üniversitesi", "Selçuk Üniversitesi",
  "Süleyman Demirel Üniversitesi", "Sağlık Bilimleri Üniversitesi",
  "Gebze Teknik Üniversitesi", "TOBB Ekonomi ve Teknoloji Üniversitesi",
];

export const DEPARTMENTS = [
  "Tıp", "Diş Hekimliği", "Eczacılık", "Hukuk", "Psikoloji", "Mimarlık",
  "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği",
  "Endüstri Mühendisliği", "İnşaat Mühendisliği", "Kimya Mühendisliği",
  "Yapay Zekâ Mühendisliği", "Yazılım Mühendisliği", "Havacılık ve Uzay Mühendisliği",
  "İşletme", "İktisat", "Uluslararası İlişkiler", "Siyaset Bilimi", "Maliye",
  "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Matematik Öğretmenliği",
  "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik",
  "Moleküler Biyoloji ve Genetik", "Matematik", "Fizik", "Kimya", "Biyoloji",
  "İngiliz Dili ve Edebiyatı", "Türk Dili ve Edebiyatı", "Tarih", "Sosyoloji",
  "Gastronomi", "Grafik Tasarım", "Mütercim-Tercümanlık", "Veterinerlik", "Radyo-TV ve Sinema",
];
