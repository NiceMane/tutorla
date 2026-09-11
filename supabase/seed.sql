-- Tutorla · müfredat tohumu (YKS)
-- ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: web/src/lib/curriculum.ts
-- Yeniden üretmek için: cd web && npm run gen:seed

insert into exams (code, name, position) values ('YKS', 'YKS', 1)
on conflict (code) do nothing;

insert into personas (code, name, trait, position, active) values
  ('curious', 'meraklı', 'Çok soru sorar, “neden” der, derinleşmek ister.', 1, true),
  ('sceptical', 'şüpheci', 'İkna olmaz, karşı örnek arar, gerekçe ister.', 2, false),
  ('impatient', 'aceleci', 'Hızlı geçmek ister, özet bekler; seni sadeleştirmeye zorlar.', 3, false)
on conflict (code) do nothing;

insert into subjects (exam_id, slug, name, position)
select e.id, v.slug, v.name, v.position
from exams e join (values
  ('matematik', 'Matematik', 1),
  ('fizik', 'Fizik', 2),
  ('kimya', 'Kimya', 3),
  ('biyoloji', 'Biyoloji', 4)
) as v(slug, name, position) on true
where e.code = 'YKS'
on conflict (exam_id, slug) do nothing;

insert into topics (subject_id, slug, name, position)
select s.id, v.topic_slug, v.name, v.position
from subjects s join (values
  ('matematik', 'limit', 'Limit', 1),
  ('matematik', 'turev-tanimi', 'Türev tanımı', 2),
  ('matematik', 'zincir-kurali', 'Zincir kuralı', 3),
  ('matematik', 'kapali-turev', 'Kapalı türev', 4),
  ('matematik', 'integral', 'İntegral', 5),
  ('fizik', 'vektorler', 'Vektörler', 1),
  ('fizik', 'newton-yasalari', 'Newton’ın hareket yasaları', 2),
  ('fizik', 'is-ve-enerji', 'İş ve enerji', 3),
  ('fizik', 'elektrik-alan', 'Elektrik alan', 4),
  ('kimya', 'atomun-yapisi', 'Atomun yapısı', 1),
  ('kimya', 'periyodik-sistem', 'Periyodik sistem', 2),
  ('kimya', 'kimyasal-baglar', 'Kimyasal bağlar', 3),
  ('kimya', 'mol-kavrami', 'Mol kavramı', 4),
  ('biyoloji', 'hucre', 'Hücre', 1),
  ('biyoloji', 'mitoz-mayoz', 'Mitoz ve mayoz', 2),
  ('biyoloji', 'kalitim', 'Kalıtım', 3),
  ('biyoloji', 'ekosistem', 'Ekosistem', 4)
) as v(subject_slug, topic_slug, name, position) on v.subject_slug = s.slug
join exams e on e.id = s.exam_id and e.code = 'YKS'
on conflict (subject_id, slug) do nothing;

insert into concepts (topic_id, slug, name, position)
select t.id, v.concept_slug, v.name, v.position
from topics t
join subjects s on s.id = t.subject_id
join (values
  ('matematik', 'limit', 'tanim', 'Tanım', 1),
  ('matematik', 'limit', 'tek-yonlu', 'Tek yönlü limitler', 2),
  ('matematik', 'limit', 'belirsizlik', 'Belirsizlik durumları', 3),
  ('matematik', 'limit', 'sonsuzda', 'Sonsuzda limit', 4),
  ('matematik', 'limit', 'sureklilik', 'Süreklilikle ilişkisi', 5),
  ('matematik', 'turev-tanimi', 'limitle-tanim', 'Limitle tanım', 1),
  ('matematik', 'turev-tanimi', 'egim', 'Teğetin eğimi', 2),
  ('matematik', 'turev-tanimi', 'turevlenebilirlik', 'Türevlenebilirlik', 3),
  ('matematik', 'turev-tanimi', 'temel-kurallar', 'Temel türev kuralları', 4),
  ('matematik', 'turev-tanimi', 'hatalar', 'Sık yapılan hatalar', 5),
  ('matematik', 'zincir-kurali', 'tanim', 'Tanım', 1),
  ('matematik', 'zincir-kurali', 'bileske', 'Bileşke fonksiyon', 2),
  ('matematik', 'zincir-kurali', 'neden-carpim', 'Neden çarpım?', 3),
  ('matematik', 'zincir-kurali', 'ornek-sin', 'Örnek: sin(x²)', 4),
  ('matematik', 'zincir-kurali', 'hatalar', 'Sık yapılan hatalar', 5),
  ('matematik', 'kapali-turev', 'ortuk-fonksiyon', 'Örtük fonksiyon', 1),
  ('matematik', 'kapali-turev', 'turev-alma', 'İki tarafın türevi', 2),
  ('matematik', 'kapali-turev', 'dy-dx', 'dy/dx’i yalnız bırakma', 3),
  ('matematik', 'kapali-turev', 'ornek-cember', 'Örnek: çember', 4),
  ('matematik', 'kapali-turev', 'hatalar', 'Sık yapılan hatalar', 5),
  ('matematik', 'integral', 'belirsiz', 'Belirsiz integral', 1),
  ('matematik', 'integral', 'belirli', 'Belirli integral', 2),
  ('matematik', 'integral', 'temel-teorem', 'Analizin temel teoremi', 3),
  ('matematik', 'integral', 'degisken-degistirme', 'Değişken değiştirme', 4),
  ('matematik', 'integral', 'alan', 'Alan hesabı', 5),
  ('fizik', 'vektorler', 'skaler-vektorel', 'Skaler ve vektörel', 1),
  ('fizik', 'vektorler', 'bilesenler', 'Bileşenlere ayırma', 2),
  ('fizik', 'vektorler', 'toplama', 'Vektör toplama', 3),
  ('fizik', 'vektorler', 'skaler-carpim', 'Skaler çarpım', 4),
  ('fizik', 'vektorler', 'uygulama', 'Problemde kullanımı', 5),
  ('fizik', 'newton-yasalari', 'eylemsizlik', 'Eylemsizlik', 1),
  ('fizik', 'newton-yasalari', 'f-ma', 'F = ma', 2),
  ('fizik', 'newton-yasalari', 'etki-tepki', 'Etki–tepki', 3),
  ('fizik', 'newton-yasalari', 'serbest-cisim', 'Serbest cisim diyagramı', 4),
  ('fizik', 'newton-yasalari', 'surtunme', 'Sürtünme kuvveti', 5),
  ('fizik', 'is-ve-enerji', 'is-tanimi', 'İşin tanımı', 1),
  ('fizik', 'is-ve-enerji', 'kinetik', 'Kinetik enerji', 2),
  ('fizik', 'is-ve-enerji', 'potansiyel', 'Potansiyel enerji', 3),
  ('fizik', 'is-ve-enerji', 'korunum', 'Enerjinin korunumu', 4),
  ('fizik', 'is-ve-enerji', 'guc', 'Güç', 5),
  ('fizik', 'elektrik-alan', 'coulomb', 'Coulomb yasası', 1),
  ('fizik', 'elektrik-alan', 'alan-cizgileri', 'Alan çizgileri', 2),
  ('fizik', 'elektrik-alan', 'potansiyel-fark', 'Potansiyel fark', 3),
  ('fizik', 'elektrik-alan', 'superpozisyon', 'Süperpozisyon', 4),
  ('fizik', 'elektrik-alan', 'uygulama', 'Problemde kullanımı', 5),
  ('kimya', 'atomun-yapisi', 'tanecikler', 'Atom altı tanecikler', 1),
  ('kimya', 'atomun-yapisi', 'izotop', 'İzotop ve kütle numarası', 2),
  ('kimya', 'atomun-yapisi', 'modeller', 'Atom modelleri', 3),
  ('kimya', 'atomun-yapisi', 'elektron-dizilimi', 'Elektron dizilimi', 4),
  ('kimya', 'atomun-yapisi', 'orbital', 'Orbital kavramı', 5),
  ('kimya', 'periyodik-sistem', 'gruplar', 'Grup ve periyot', 1),
  ('kimya', 'periyodik-sistem', 'yaricap', 'Atom yarıçapı', 2),
  ('kimya', 'periyodik-sistem', 'iyonlasma', 'İyonlaşma enerjisi', 3),
  ('kimya', 'periyodik-sistem', 'elektronegatiflik', 'Elektronegatiflik', 4),
  ('kimya', 'periyodik-sistem', 'egilimler', 'Periyodik eğilimler', 5),
  ('kimya', 'kimyasal-baglar', 'iyonik', 'İyonik bağ', 1),
  ('kimya', 'kimyasal-baglar', 'kovalent', 'Kovalent bağ', 2),
  ('kimya', 'kimyasal-baglar', 'metalik', 'Metalik bağ', 3),
  ('kimya', 'kimyasal-baglar', 'polarlik', 'Polarlık', 4),
  ('kimya', 'kimyasal-baglar', 'molekuller-arasi', 'Moleküller arası etkileşim', 5),
  ('kimya', 'mol-kavrami', 'avogadro', 'Avogadro sayısı', 1),
  ('kimya', 'mol-kavrami', 'molar-kutle', 'Molar kütle', 2),
  ('kimya', 'mol-kavrami', 'mol-hesabi', 'Mol hesabı', 3),
  ('kimya', 'mol-kavrami', 'denklem-denklestirme', 'Denklem denkleştirme', 4),
  ('kimya', 'mol-kavrami', 'sinirlayici', 'Sınırlayıcı bileşen', 5),
  ('biyoloji', 'hucre', 'zar', 'Hücre zarı', 1),
  ('biyoloji', 'hucre', 'organeller', 'Organeller', 2),
  ('biyoloji', 'hucre', 'tasima', 'Madde taşınması', 3),
  ('biyoloji', 'hucre', 'prokaryot-okaryot', 'Prokaryot ve ökaryot', 4),
  ('biyoloji', 'hucre', 'metabolizma', 'Hücresel metabolizma', 5),
  ('biyoloji', 'mitoz-mayoz', 'hucre-dongusu', 'Hücre döngüsü', 1),
  ('biyoloji', 'mitoz-mayoz', 'mitoz', 'Mitoz evreleri', 2),
  ('biyoloji', 'mitoz-mayoz', 'mayoz', 'Mayoz evreleri', 3),
  ('biyoloji', 'mitoz-mayoz', 'crossing-over', 'Krossing over', 4),
  ('biyoloji', 'mitoz-mayoz', 'farklar', 'İkisinin farkı', 5),
  ('biyoloji', 'kalitim', 'mendel', 'Mendel yasaları', 1),
  ('biyoloji', 'kalitim', 'genotip-fenotip', 'Genotip ve fenotip', 2),
  ('biyoloji', 'kalitim', 'capraz', 'Çaprazlama', 3),
  ('biyoloji', 'kalitim', 'esey-bagli', 'Eşeye bağlı kalıtım', 4),
  ('biyoloji', 'kalitim', 'soyagaci', 'Soy ağacı okuma', 5),
  ('biyoloji', 'ekosistem', 'besin-zinciri', 'Besin zinciri', 1),
  ('biyoloji', 'ekosistem', 'enerji-akisi', 'Enerji akışı', 2),
  ('biyoloji', 'ekosistem', 'madde-dongusu', 'Madde döngüleri', 3),
  ('biyoloji', 'ekosistem', 'populasyon', 'Popülasyon dinamiği', 4),
  ('biyoloji', 'ekosistem', 'surdurulebilirlik', 'Sürdürülebilirlik', 5)
) as v(subject_slug, topic_slug, concept_slug, name, position)
  on v.topic_slug = t.slug and v.subject_slug = s.slug
join exams e on e.id = s.exam_id and e.code = 'YKS'
on conflict (topic_id, slug) do nothing;
