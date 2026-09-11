/* YKS müfredatı — tek gerçek kaynak.
   supabase/seed.sql bu dosyadan üretilir: npm run gen:seed
   Elle iki yerde tutulmuyor ki kaymasın. */

export type SeedConcept = {
  slug: string;
  name: string;
  /* Senaryolu öğrencinin bu kavramı sorarken kullandığı cümle.
     AI motoru devreye girince kullanılmayacak — o zaman persona prompt'u üretecek. */
  probe?: string;
  /* Anlatımda geçmesi beklenen anahtar kelimeler; boşluk tespiti bunlara bakar. */
  keywords?: string[];
  /* Boşluk etiketi. Yazılmazsa kavram adından türetilir. */
  gapLabel?: string;
};
export type SeedTopic = { slug: string; name: string; concepts: SeedConcept[] };
export type SeedSubject = { slug: string; name: string; topics: SeedTopic[] };

export const EXAM = { code: "YKS", name: "YKS" } as const;

export const PERSONAS = [
  { code: "curious", name: "meraklı", trait: "Çok soru sorar, “neden” der, derinleşmek ister.", active: true },
  { code: "sceptical", name: "şüpheci", trait: "İkna olmaz, karşı örnek arar, gerekçe ister.", active: false },
  { code: "impatient", name: "aceleci", trait: "Hızlı geçmek ister, özet bekler; seni sadeleştirmeye zorlar.", active: false },
] as const;

export const CURRICULUM: SeedSubject[] = [
  {
    slug: "matematik",
    name: "Matematik",
    topics: [
      {
        slug: "limit",
        name: "Limit",
        concepts: [
          { slug: "tanim", name: "Tanım", keywords: ["yaklaş", "değer", "limit"] },
          { slug: "tek-yonlu", name: "Tek yönlü limitler", keywords: ["sağdan", "soldan", "tek yön"] },
          { slug: "belirsizlik", name: "Belirsizlik durumları", keywords: ["belirsiz", "0/0", "sonsuz"] },
          { slug: "sonsuzda", name: "Sonsuzda limit", keywords: ["sonsuz", "asimptot"] },
          { slug: "sureklilik", name: "Süreklilikle ilişkisi", keywords: ["sürekli", "kopuk", "tanımlı"] },
        ],
      },
      {
        slug: "turev-tanimi",
        name: "Türev tanımı",
        concepts: [
          { slug: "limitle-tanim", name: "Limitle tanım", keywords: ["limit", "fark", "h"] },
          { slug: "egim", name: "Teğetin eğimi", keywords: ["eğim", "teğet", "doğru"] },
          { slug: "turevlenebilirlik", name: "Türevlenebilirlik", keywords: ["türevlenebilir", "köşe", "sürekli"] },
          { slug: "temel-kurallar", name: "Temel türev kuralları", keywords: ["kural", "çarpım", "bölüm", "üs"] },
          { slug: "hatalar", name: "Sık yapılan hatalar", keywords: ["hata", "unut", "karıştır"] },
        ],
      },
      {
        /* Marka dosyasındaki seans ekranının konusu — en zengin senaryo burada. */
        slug: "zincir-kurali",
        name: "Zincir kuralı",
        concepts: [
          {
            slug: "tanim",
            name: "Tanım",
            probe: "Türevi biraz biliyorum. Ama “zincir kuralı” ismi nereden geliyor? Zincirle ne alakası var?",
            keywords: ["iç içe", "bileşke", "f(g(x))", "dıştaki", "içteki", "zincir"],
            gapLabel: "boşluk: zincirin ne olduğu açıklanmadı",
          },
          {
            slug: "bileske",
            name: "Bileşke fonksiyon",
            probe: "Bileşke fonksiyon derken tam olarak neyi kastediyorsun? Bir örnek verir misin?",
            keywords: ["bileşke", "iç fonksiyon", "dış fonksiyon", "f(g(x))", "içine"],
            gapLabel: "boşluk: bileşke fonksiyon örneklenmedi",
          },
          {
            slug: "neden-carpim",
            name: "Neden çarpım?",
            probe: "Tamam, halkalar güzel. Peki neden <strong>çarpıyoruz</strong> da toplamıyoruz? Bir örnekle gösterebilir misin?",
            keywords: ["çarp", "oran", "değişim hızı", "kat", "zincirleme"],
            gapLabel: "boşluk: çarpımın nedeni açıklanmadı",
          },
          {
            slug: "ornek-sin",
            name: "Örnek: sin(x²)",
            probe: "sin(x²)'nin türevini birlikte alalım mı? Adım adım söyle, ben yazayım.",
            keywords: ["sin", "cos", "x²", "2x", "türev"],
            gapLabel: "boşluk: örnek adım adım gösterilmedi",
          },
          {
            slug: "hatalar",
            name: "Sık yapılan hatalar",
            probe: "Bu konuda insanlar en çok nerede hata yapıyor? Ben de yapmayayım.",
            keywords: ["hata", "unut", "içteki", "çarpmayı", "karıştır"],
            gapLabel: "boşluk: sık yapılan hatalar sayılmadı",
          },
        ],
      },
      {
        slug: "kapali-turev",
        name: "Kapalı türev",
        concepts: [
          { slug: "ortuk-fonksiyon", name: "Örtük fonksiyon", keywords: ["örtük", "kapalı", "y"] },
          { slug: "turev-alma", name: "İki tarafın türevi", keywords: ["iki taraf", "türev", "eşitlik"] },
          { slug: "dy-dx", name: "dy/dx’i yalnız bırakma", keywords: ["dy/dx", "yalnız", "çek"] },
          { slug: "ornek-cember", name: "Örnek: çember", keywords: ["çember", "x²+y²", "yarıçap"] },
          { slug: "hatalar", name: "Sık yapılan hatalar", keywords: ["hata", "zincir", "unut"] },
        ],
      },
      {
        slug: "integral",
        name: "İntegral",
        concepts: [
          { slug: "belirsiz", name: "Belirsiz integral", keywords: ["belirsiz", "sabit", "+c"] },
          { slug: "belirli", name: "Belirli integral", keywords: ["belirli", "sınır", "alt", "üst"] },
          { slug: "temel-teorem", name: "Analizin temel teoremi", keywords: ["temel teorem", "ters", "türev"] },
          { slug: "degisken-degistirme", name: "Değişken değiştirme", keywords: ["değişken", "u", "dönüşüm"] },
          { slug: "alan", name: "Alan hesabı", keywords: ["alan", "eğri", "altında"] },
        ],
      },
    ],
  },
  {
    slug: "fizik",
    name: "Fizik",
    topics: [
      {
        slug: "vektorler",
        name: "Vektörler",
        concepts: [
          { slug: "skaler-vektorel", name: "Skaler ve vektörel", keywords: ["skaler", "vektörel", "yön"] },
          { slug: "bilesenler", name: "Bileşenlere ayırma", keywords: ["bileşen", "x", "y", "sin", "cos"] },
          { slug: "toplama", name: "Vektör toplama", keywords: ["toplama", "paralelkenar", "uç uca"] },
          { slug: "skaler-carpim", name: "Skaler çarpım", keywords: ["skaler çarpım", "açı", "cos"] },
          { slug: "uygulama", name: "Problemde kullanımı", keywords: ["problem", "kuvvet", "denge"] },
        ],
      },
      {
        slug: "newton-yasalari",
        name: "Newton’ın hareket yasaları",
        concepts: [
          { slug: "eylemsizlik", name: "Eylemsizlik", keywords: ["eylemsizlik", "durgun", "sabit hız"] },
          { slug: "f-ma", name: "F = ma", keywords: ["kuvvet", "kütle", "ivme"] },
          { slug: "etki-tepki", name: "Etki–tepki", keywords: ["etki", "tepki", "zıt"] },
          { slug: "serbest-cisim", name: "Serbest cisim diyagramı", keywords: ["diyagram", "kuvvet", "ok"] },
          { slug: "surtunme", name: "Sürtünme kuvveti", keywords: ["sürtünme", "katsayı", "normal"] },
        ],
      },
      {
        slug: "is-ve-enerji",
        name: "İş ve enerji",
        concepts: [
          { slug: "is-tanimi", name: "İşin tanımı", keywords: ["iş", "kuvvet", "yol"] },
          { slug: "kinetik", name: "Kinetik enerji", keywords: ["kinetik", "hız", "1/2mv²"] },
          { slug: "potansiyel", name: "Potansiyel enerji", keywords: ["potansiyel", "yükseklik", "mgh"] },
          { slug: "korunum", name: "Enerjinin korunumu", keywords: ["korunum", "toplam", "dönüş"] },
          { slug: "guc", name: "Güç", keywords: ["güç", "zaman", "watt"] },
        ],
      },
      {
        slug: "elektrik-alan",
        name: "Elektrik alan",
        concepts: [
          { slug: "coulomb", name: "Coulomb yasası", keywords: ["coulomb", "yük", "uzaklık"] },
          { slug: "alan-cizgileri", name: "Alan çizgileri", keywords: ["alan çizgi", "yön", "yoğunluk"] },
          { slug: "potansiyel-fark", name: "Potansiyel fark", keywords: ["potansiyel", "volt", "fark"] },
          { slug: "superpozisyon", name: "Süperpozisyon", keywords: ["süperpozisyon", "toplam", "vektör"] },
          { slug: "uygulama", name: "Problemde kullanımı", keywords: ["problem", "yük", "hesap"] },
        ],
      },
    ],
  },
  {
    slug: "kimya",
    name: "Kimya",
    topics: [
      {
        slug: "atomun-yapisi",
        name: "Atomun yapısı",
        concepts: [
          { slug: "tanecikler", name: "Atom altı tanecikler", keywords: ["proton", "nötron", "elektron"] },
          { slug: "izotop", name: "İzotop ve kütle numarası", keywords: ["izotop", "kütle numarası", "nötron"] },
          { slug: "modeller", name: "Atom modelleri", keywords: ["dalton", "bohr", "model"] },
          { slug: "elektron-dizilimi", name: "Elektron dizilimi", keywords: ["dizilim", "katman", "orbital"] },
          { slug: "orbital", name: "Orbital kavramı", keywords: ["orbital", "s", "p", "olasılık"] },
        ],
      },
      {
        slug: "periyodik-sistem",
        name: "Periyodik sistem",
        concepts: [
          { slug: "gruplar", name: "Grup ve periyot", keywords: ["grup", "periyot", "sütun"] },
          { slug: "yaricap", name: "Atom yarıçapı", keywords: ["yarıçap", "büyür", "küçülür"] },
          { slug: "iyonlasma", name: "İyonlaşma enerjisi", keywords: ["iyonlaşma", "enerji", "elektron kopar"] },
          { slug: "elektronegatiflik", name: "Elektronegatiflik", keywords: ["elektronegatif", "çekme"] },
          { slug: "egilimler", name: "Periyodik eğilimler", keywords: ["eğilim", "artar", "azalır"] },
        ],
      },
      {
        slug: "kimyasal-baglar",
        name: "Kimyasal bağlar",
        concepts: [
          { slug: "iyonik", name: "İyonik bağ", keywords: ["iyonik", "aktarım", "metal"] },
          { slug: "kovalent", name: "Kovalent bağ", keywords: ["kovalent", "ortaklaşa", "paylaş"] },
          { slug: "metalik", name: "Metalik bağ", keywords: ["metalik", "elektron denizi"] },
          { slug: "polarlik", name: "Polarlık", keywords: ["polar", "apolar", "dipol"] },
          { slug: "molekuller-arasi", name: "Moleküller arası etkileşim", keywords: ["hidrojen bağı", "van der waals"] },
        ],
      },
      {
        slug: "mol-kavrami",
        name: "Mol kavramı",
        concepts: [
          { slug: "avogadro", name: "Avogadro sayısı", keywords: ["avogadro", "6,02", "tanecik"] },
          { slug: "molar-kutle", name: "Molar kütle", keywords: ["molar", "gram", "kütle"] },
          { slug: "mol-hesabi", name: "Mol hesabı", keywords: ["mol", "hesap", "oran"] },
          { slug: "denklem-denklestirme", name: "Denklem denkleştirme", keywords: ["denkleştir", "katsayı", "korunum"] },
          { slug: "sinirlayici", name: "Sınırlayıcı bileşen", keywords: ["sınırlayıcı", "artan", "biter"] },
        ],
      },
    ],
  },
  {
    slug: "biyoloji",
    name: "Biyoloji",
    topics: [
      {
        slug: "hucre",
        name: "Hücre",
        concepts: [
          { slug: "zar", name: "Hücre zarı", keywords: ["zar", "fosfolipit", "seçici"] },
          { slug: "organeller", name: "Organeller", keywords: ["mitokondri", "ribozom", "organel"] },
          { slug: "tasima", name: "Madde taşınması", keywords: ["difüzyon", "osmoz", "aktif taşıma"] },
          { slug: "prokaryot-okaryot", name: "Prokaryot ve ökaryot", keywords: ["prokaryot", "ökaryot", "çekirdek"] },
          { slug: "metabolizma", name: "Hücresel metabolizma", keywords: ["metabolizma", "atp", "enzim"] },
        ],
      },
      {
        slug: "mitoz-mayoz",
        name: "Mitoz ve mayoz",
        concepts: [
          { slug: "hucre-dongusu", name: "Hücre döngüsü", keywords: ["döngü", "interfaz", "evre"] },
          { slug: "mitoz", name: "Mitoz evreleri", keywords: ["profaz", "metafaz", "anafaz", "telofaz"] },
          { slug: "mayoz", name: "Mayoz evreleri", keywords: ["mayoz", "iki bölünme", "haploit"] },
          { slug: "crossing-over", name: "Krossing over", keywords: ["krossing", "parça değişim", "çeşitlilik"] },
          { slug: "farklar", name: "İkisinin farkı", keywords: ["fark", "kromozom sayısı", "üreme"] },
        ],
      },
      {
        slug: "kalitim",
        name: "Kalıtım",
        concepts: [
          { slug: "mendel", name: "Mendel yasaları", keywords: ["mendel", "ayrılma", "bağımsız"] },
          { slug: "genotip-fenotip", name: "Genotip ve fenotip", keywords: ["genotip", "fenotip", "görünüş"] },
          { slug: "capraz", name: "Çaprazlama", keywords: ["çaprazlama", "punnett", "oran"] },
          { slug: "esey-bagli", name: "Eşeye bağlı kalıtım", keywords: ["eşey", "x", "renk körlüğü"] },
          { slug: "soyagaci", name: "Soy ağacı okuma", keywords: ["soy ağacı", "taşıyıcı", "nesil"] },
        ],
      },
      {
        slug: "ekosistem",
        name: "Ekosistem",
        concepts: [
          { slug: "besin-zinciri", name: "Besin zinciri", keywords: ["besin zinciri", "üretici", "tüketici"] },
          { slug: "enerji-akisi", name: "Enerji akışı", keywords: ["enerji", "piramit", "kayıp"] },
          { slug: "madde-dongusu", name: "Madde döngüleri", keywords: ["azot", "karbon", "döngü"] },
          { slug: "populasyon", name: "Popülasyon dinamiği", keywords: ["popülasyon", "taşıma kapasitesi"] },
          { slug: "surdurulebilirlik", name: "Sürdürülebilirlik", keywords: ["sürdürülebilir", "denge", "kaynak"] },
        ],
      },
    ],
  },
];

export const CONCEPT_COUNT = CURRICULUM.reduce(
  (n, s) => n + s.topics.reduce((m, t) => m + t.concepts.length, 0),
  0,
);
