import type { Room } from "./types";

/*
 * SAMPLE rooms for the public "Our classrooms" pages.
 *
 * The owner asked for the website to show mock rooms of the university; there
 * is no public rooms API (the portal's rooms need room:read, bookings need
 * room:book — experts book real rooms in the dashboard). Everything here is
 * invented but plausible: AzTU-style buildings, capacities, equipment and
 * booking rules. Content stays Azerbaijani in both locales, like course titles.
 * The pages must never present these rooms as bookable for real — see the
 * honesty rules in ./source.server.ts.
 *
 * No room has a `photo`: the only pictures at hand are the sample courses'
 * stock covers (a laptop, a dashboard, hands drafting), which do not show a
 * room and would repeat the course cards. Every room gets its generated floor
 * plan instead; a real photo can be set here once one exists.
 *
 * The busy calendar is generated, deterministically, in ./schedule.ts and
 * re-exported below so a page can import everything from here. Client
 * components should import the helpers from ./schedule directly, so their
 * bundle does not carry the room texts.
 */

export * from "./schedule";

// ---------------------------------------------------------------- campus

/* H. Cavid pr. 25 — the buildings sit a few dozen metres apart. */
const B1 = { building: "Əsas bina", buildingCode: "B1", coords: { lat: 40.3777, lng: 49.852 } };
const B2 = { building: "II tədris binası", buildingCode: "B2", coords: { lat: 40.3783, lng: 49.8511 } };
const B3 = { building: "Mühəndislik korpusu", buildingCode: "B3", coords: { lat: 40.3771, lng: 49.8531 } };
const B4 = { building: "Kitabxana-informasiya mərkəzi", buildingCode: "B4", coords: { lat: 40.3787, lng: 49.8528 } };

/*
 * Rules every room shares; each room adds its own after these.
 *
 * Only rules the flow keeps are stated as rules. Neither the sample reserve
 * check (reservationProblem in ./schedule.ts) nor the portal's real booking
 * service has a lead time, so the first rule asks for an early request
 * instead of promising a minimum notice nothing enforces.
 */
const BASE_RULES = [
  "Sorğunu mümkün qədər tez göndərin: rezerv universitet təsdiqləyənədək qüvvədə deyil.",
  "Rezervi ləğv etmək lazım gələrsə, ən gec 24 saat əvvəl xəbər verin.",
  "İstifadədən sonra otağı ilkin vəziyyətinə qaytarın: mebel yerində, avadanlıq söndürülmüş.",
];

// ---------------------------------------------------------------- rooms

export const ROOMS: Room[] = [
  {
    id: "room-b1-101",
    slug: "b1-101-boyuk-muhazire-zali",
    name: "Böyük mühazirə zalı 101",
    kind: "LECTURE",
    ...B1, floor: 1, roomNumber: "101",
    capacity: 180, areaM2: 240,
    hue: "build",
    summary: "Pilləli oturacaqları olan 180 yerlik zal: axın mühazirələri, açıq dərslər və böyük qruplar üçün.",
    description: [
      "Əsas binanın birinci mərtəbəsindəki ən böyük mühazirə zalı birinci kursların axın mühazirələri üçün nəzərdə tutulub. Pilləli oturacaqlar sayəsində zalın istənilən yerindən lövhə və ekran aydın görünür.",
      "Zalda iki proyektor, geniş ekran, simsiz mikrofonlarla səs gücləndirmə sistemi və mühazirəni yazmaq üçün kamera var. Axşam saatlarında zal təlim mərkəzinin böyük qruplarına və açıq mühazirələrə verilir.",
      "Girişə pandus və liftlə çatmaq olar; birinci cərgədə əlil arabası üçün yerlər ayrılıb.",
    ],
    equipment: [
      "2 lazer proyektor (5000 lümen) və 4 × 2,5 m ekran",
      "Səs gücləndirmə sistemi, 2 simsiz mikrofon",
      "Mühazirə yazısı üçün PTZ kamera",
      "Müəllim masası: kompüter, HDMI və USB-C girişləri",
      "Sürüşkən təbaşir lövhəsi (3 panel)",
      "Mərkəzi kondisioner sistemi",
    ],
    amenities: ["PROJECTOR", "AUDIO", "WHITEBOARD", "AIR_CON", "ACCESSIBLE", "WIFI"],
    layout: "THEATRE",
    openHours: { weekday: ["08:30", "20:00"], saturday: ["09:00", "17:00"] },
    rules: [
      ...BASE_RULES,
      "Səs sistemi və kamera texniki əməkdaşın iştirakı ilə işə salınır — ehtiyacınızı rezervdə qeyd edin.",
      "Zalda qida qəbulu qadağandır; qapalı qabda su olar.",
    ],
  },
  {
    id: "room-b1-214",
    slug: "b1-214-muhazire-auditoriyasi",
    name: "Mühazirə auditoriyası 214",
    kind: "LECTURE",
    ...B1, floor: 2, roomNumber: "214",
    capacity: 72, areaM2: 110,
    hue: "trans",
    summary: "72 yerlik işıqlı auditoriya: mühazirə, praktiki məşğələ və qrup dərsləri üçün.",
    description: [
      "Əsas binanın ikinci mərtəbəsində yerləşən auditoriya iki-üç akademik qrupun birgə mühazirələri və praktiki məşğələlər üçün istifadə olunur. Pəncərələri həyətə baxır, gün ərzində təbii işıq kifayətdir.",
      "İnteraktiv lövhə və proyektor dərs materiallarını göstərməyə, yazılanları isə PDF kimi saxlamağa imkan verir. Masalar sabitdir, cərgələr arasında keçid genişdir.",
    ],
    equipment: [
      "86 düymlük interaktiv lövhə",
      "Proyektor və 3 m ekran",
      "Müəllim kompüteri (Windows 11, MS Office)",
      "Marker lövhəsi",
      "Kondisioner (2 ədəd)",
    ],
    amenities: ["PROJECTOR", "SMART_BOARD", "WHITEBOARD", "AIR_CON", "WIFI"],
    layout: "CLASSROOM",
    openHours: { weekday: ["08:30", "20:00"], saturday: ["09:00", "17:00"] },
    rules: [...BASE_RULES, "İnteraktiv lövhədə saxlanılan fayllar hər gün sonda silinir."],
  },
  {
    id: "room-b1-120",
    slug: "b1-120-akt-zali",
    name: "Akt zalı",
    kind: "CONFERENCE",
    ...B1, floor: 1, roomNumber: "120",
    capacity: 350, areaM2: 420,
    hue: "navy",
    summary: "Universitetin 350 yerlik əsas zalı: konfranslar, təntənəli tədbirlər və açıq mühazirələr.",
    description: [
      "Akt zalı universitetin böyük tədbirlərinin keçirildiyi məkandır: elmi-praktiki konfranslar, Bilik günü, məzunlarla görüşlər, karyera günləri və qonaq professorların açıq mühazirələri.",
      "Səhnədə tribuna, geniş LED ekran və konfrans səs sistemi quraşdırılıb. Onlayn iştirakçılar üçün tədbiri canlı yayımlamaq və sinxron tərcümə kabinələrindən istifadə etmək mümkündür.",
      "Tədbirdən əvvəl texniki məşq üçün vaxt ayırmağınızı tövsiyə edirik — bu da rezervə daxil edilməlidir.",
    ],
    equipment: [
      "LED ekran (6 × 3,4 m)",
      "Konfrans səs sistemi, 4 simsiz və 2 tribuna mikrofonu",
      "Canlı yayım üçün 3 kameralı video sistem",
      "2 sinxron tərcümə kabinəsi, 150 qulaqlıq",
      "Səhnə işıqlandırması",
      "Qonaqlar üçün foye və qarderob",
    ],
    amenities: ["PROJECTOR", "AUDIO", "VIDEO_CONF", "AIR_CON", "ACCESSIBLE", "WIFI"],
    layout: "THEATRE",
    openHours: { weekday: ["09:00", "21:00"], saturday: ["10:00", "18:00"] },
    rules: [
      ...BASE_RULES,
      "Tədbirin proqramı və iştirakçıların təxmini sayı rezervlə birlikdə təqdim olunur.",
      "Səs, işıq və yayım avadanlığı yalnız zalın texniki qrupu tərəfindən idarə olunur.",
      "Zalın bəzədilməsi və reklam materialları əvvəlcədən ictimaiyyətlə əlaqələr şöbəsi ilə razılaşdırılır.",
    ],
  },
  {
    id: "room-b1-305",
    slug: "b1-305-elmi-sura-zali",
    name: "Elmi Şura zalı",
    kind: "CONFERENCE",
    ...B1, floor: 3, roomNumber: "305",
    capacity: 36, areaM2: 95,
    hue: "navy",
    summary: "36 yerlik iclas zalı: Elmi Şura, dissertasiya müdafiələri və videokonfranslar.",
    description: [
      "Oval masa ətrafında 24 və divar boyunca 12 yeri olan zal Elmi Şuranın iclasları, dissertasiya müdafiələri və tərəfdaşlarla görüşlər üçündür.",
      "Zaldakı videokonfrans sistemi xarici universitetlərlə onlayn iclasları və birgə müdafiələri mümkün edir: masa arxasındakı hər yerdə mikrofon, divarda iki böyük ekran var.",
    ],
    equipment: [
      "Videokonfrans sistemi (4K kamera, tavan mikrofonları)",
      "2 × 75 düymlük ekran",
      "Diskussiya sistemi: 24 masaüstü mikrofon",
      "Simsiz ekran paylaşımı",
      "Kondisioner",
    ],
    amenities: ["VIDEO_CONF", "AUDIO", "AIR_CON", "ACCESSIBLE", "WIFI"],
    layout: "BOARDROOM",
    openHours: { weekday: ["09:00", "18:00"], saturday: null },
    rules: [
      ...BASE_RULES,
      "Elmi Şuranın və dissertasiya şuralarının iclasları digər rezervlərdən üstündür.",
      "Videokonfrans üçün bağlantı ən azı bir gün əvvəl texniki əməkdaşla yoxlanılır.",
    ],
  },
  {
    id: "room-b2-204",
    slug: "b2-204-komputer-laboratoriyasi",
    name: "Kompüter laboratoriyası 204",
    kind: "COMPUTER_LAB",
    ...B2, floor: 2, roomNumber: "204",
    capacity: 32, areaM2: 85,
    hue: "it",
    summary: "32 iş stansiyası: proqramlaşdırma, şəbəkələr və verilənlər bazaları üzrə praktiki dərslər.",
    description: [
      "II tədris binasındakı bu laboratoriya proqramlaşdırma, veb texnologiyaları, verilənlər bazaları və kompüter şəbəkələri üzrə praktiki dərslər üçün qurulub. Hər iş yerində eyni proqram təminatı var, ona görə dərs istənilən kompüterdə eyni cür keçir.",
      "Axşam saatlarında laboratoriyada təlim mərkəzinin praktiki qrupları — veb proqramlaşdırma, SQL və kibertəhlükəsizlik — məşğələ keçir.",
      "Müəllim ekranı bütün iş stansiyalarına yayımlana bilər, iştirakçıların ekranları isə müəllim kompüterindən izlənilir.",
    ],
    equipment: [
      "32 iş stansiyası (Intel Core i7, 32 GB RAM, 24 düymlük monitor)",
      "Müəllim iş stansiyası və sinif idarəetmə proqramı",
      "Proyektor və 3 m ekran",
      "Proqram təminatı: VS Code, JetBrains IDE-ləri, Python, Node.js, PostgreSQL, Docker, Cisco Packet Tracer",
      "1 Gbit/s kabel şəbəkəsi və Wi-Fi 6",
      "Marker lövhəsi",
    ],
    amenities: ["COMPUTERS", "PROJECTOR", "WHITEBOARD", "AIR_CON", "WIFI"],
    layout: "LAB",
    openHours: { weekday: ["09:00", "20:00"], saturday: ["10:00", "17:00"] },
    rules: [
      ...BASE_RULES,
      "Laboratoriyada qida və içki qəbulu qadağandır.",
      "Əlavə proqram təminatı ən azı 5 iş günü əvvəl sistem inzibatçısı ilə razılaşdırılır.",
      "Kompüterlərdə saxlanılan fayllar hər gecə silinir — işinizi özünüzlə aparın.",
    ],
  },
  {
    id: "room-b2-311",
    slug: "b2-311-suni-intellekt-laboratoriyasi",
    name: "Süni intellekt laboratoriyası 311",
    kind: "COMPUTER_LAB",
    ...B2, floor: 3, roomNumber: "311",
    capacity: 24, areaM2: 78,
    hue: "data",
    summary: "GPU-lu 24 iş stansiyası: maşın öyrənməsi, məlumat analizi və kompüter görməsi.",
    description: [
      "Laboratoriya maşın öyrənməsi, məlumat analizi və kompüter görməsi üzrə dərslər və tədqiqat layihələri üçün nəzərdə tutulub. Hər iş stansiyasında modelləri yerli olaraq öyrətmək üçün ayrıca qrafik prosessor var.",
      "Böyük modellər üçün iş stansiyaları kafedranın hesablama serverinə qoşulur. Magistrantlar və tədqiqat qrupları laboratoriyadan dərsdən kənar saatlarda da istifadə edir.",
    ],
    equipment: [
      "24 iş stansiyası (NVIDIA RTX 4070, 64 GB RAM)",
      "Hesablama serveri: 4 × NVIDIA A100 (uzaqdan giriş)",
      "Proqram təminatı: Python, Jupyter, PyTorch, TensorFlow, scikit-learn, pandas",
      "86 düymlük interaktiv lövhə",
      "Kondisioner və əlavə soyutma",
    ],
    amenities: ["COMPUTERS", "SMART_BOARD", "AIR_CON", "WIFI"],
    layout: "LAB",
    openHours: { weekday: ["09:00", "20:00"], saturday: ["10:00", "17:00"] },
    rules: [
      ...BASE_RULES,
      "Laboratoriyada qida və içki qəbulu qadağandır.",
      "Hesablama serverindən istifadə ayrıca razılaşdırılır; növbə kafedra tərəfindən bölüşdürülür.",
    ],
  },
  {
    id: "room-b2-118",
    slug: "b2-118-seminar-otagi",
    name: "Seminar otağı 118",
    kind: "SEMINAR",
    ...B2, floor: 1, roomNumber: "118",
    capacity: 28, areaM2: 60,
    hue: "biz",
    summary: "Masaları yerini dəyişən 28 yerlik otaq: seminarlar, keyslər və qrup işləri üçün.",
    description: [
      "Seminar otağında masalar təkərlidir: dərsin formatına görə onları U şəklində, kiçik qruplar üzrə və ya bir böyük masa kimi düzmək olar. Otaq menecment, layihə idarəetməsi və soft-skills seminarları üçün ən çox seçilən məkandır.",
      "Divarlardan birinin tamamı marker lövhəsidir, flipçartlar və stikerlər hər zaman yerindədir. Proyektor və simsiz ekran paylaşımı qrupların nəticələrini tez göstərməyə imkan verir.",
    ],
    equipment: [
      "Təkərli masalar və stullar (28 yer)",
      "Proyektor və simsiz ekran paylaşımı",
      "Tam divar boyu marker lövhəsi",
      "2 flipçart, stiker və markerlər",
      "Kondisioner",
    ],
    amenities: ["PROJECTOR", "WHITEBOARD", "AIR_CON", "ACCESSIBLE", "WIFI"],
    layout: "U_SHAPE",
    openHours: { weekday: ["09:00", "19:00"], saturday: ["10:00", "15:00"] },
    rules: [...BASE_RULES, "Masaların düzülüşünü dəyişmisinizsə, çıxarkən U şəklinə qaytarın."],
  },
  {
    id: "room-b3-105",
    slug: "b3-105-elektrotexnika-laboratoriyasi",
    name: "Elektrotexnika laboratoriyası 105",
    kind: "ENGINEERING_LAB",
    ...B3, floor: 1, roomNumber: "105",
    capacity: 20, areaM2: 120,
    hue: "energy",
    summary: "10 laboratoriya stendi: elektrik dövrələri, elektrik maşınları və ölçmə texnikası.",
    description: [
      "Mühəndislik korpusunun birinci mərtəbəsindəki laboratoriyada elektrik dövrələri, elektrik maşınları, elektronika və ölçmə texnikası üzrə laboratoriya işləri aparılır. İştirakçılar cüt-cüt, hər biri ayrıca stenddə işləyir.",
      "Stendlər qoruyucu avtomatlarla və təcili söndürmə düyməsi ilə təchiz olunub. Laboratoriya işləri yalnız laborantın nəzarəti altında keçirilir, ilk dərsdən əvvəl təhlükəsizlik təlimatı verilir.",
      "Günəş panelləri və invertorla işləyən kiçik stend bərpa olunan enerji mövzusunda təlimlər üçün istifadə olunur.",
    ],
    equipment: [
      "10 universal elektrotexnika stendi",
      "Rəqəmsal osilloqraflar (10 ədəd) və multimetrlər",
      "Asinxron və sabit cərəyan mühərrikləri ilə sınaq qurğusu",
      "Günəş paneli, invertor və akkumulyatorla tədris stendi",
      "Proyektor və marker lövhəsi",
    ],
    amenities: ["LAB_BENCHES", "PROJECTOR", "WHITEBOARD", "ACCESSIBLE"],
    layout: "LAB",
    openHours: { weekday: ["09:00", "18:00"], saturday: null },
    rules: [
      ...BASE_RULES,
      "Stendlərdə yalnız laborantın iştirakı ilə və təhlükəsizlik təlimatından sonra işləmək olar.",
      "Laboratoriyaya qapalı ayaqqabı ilə daxil olun; qida və içki qadağandır.",
    ],
  },
  {
    id: "room-b3-210",
    slug: "b3-210-robototexnika-laboratoriyasi",
    name: "Robototexnika laboratoriyası 210",
    kind: "ENGINEERING_LAB",
    ...B3, floor: 2, roomNumber: "210",
    capacity: 18, areaM2: 95,
    hue: "eng",
    summary: "Sənaye robot-manipulyatoru, PLC stendləri və 3D printerlər: mexatronika və robototexnika.",
    description: [
      "Laboratoriya mexatronika, avtomatik idarəetmə və robototexnika fənləri üçün qurulub. Burada sənaye robot-manipulyatorunu proqramlaşdırmaq, PLC ilə istehsal xəttinin modelini idarə etmək və mikrokontrollerlərlə prototip yığmaq olur.",
      "3D printerlər və lehimləmə məntəqələri tələbə layihələri və robototexnika dərnəyi üçün açıqdır. Şənbə günləri laboratoriyada dərnəyin məşğələləri keçir.",
    ],
    equipment: [
      "6 oxlu sənaye robot-manipulyatoru (təhlükəsizlik qəfəsi ilə)",
      "6 PLC tədris stendi (Siemens S7-1200)",
      "Konveyer xəttinin modeli və sensor dəstləri",
      "3 ədəd 3D printer",
      "Arduino və Raspberry Pi dəstləri, 4 lehimləmə məntəqəsi",
      "9 iş stansiyası (TIA Portal, MATLAB/Simulink)",
    ],
    amenities: ["LAB_BENCHES", "COMPUTERS", "PROJECTOR", "WHITEBOARD", "AIR_CON", "WIFI"],
    layout: "LAB",
    openHours: { weekday: ["09:00", "19:00"], saturday: ["10:00", "16:00"] },
    rules: [
      ...BASE_RULES,
      "Robot-manipulyator yalnız laborantın iştirakı ilə və qəfəs bağlı olanda işə salınır.",
      "3D çap üçün material əvvəlcədən laborantla razılaşdırılır.",
      "Lehimləmə yalnız sorucu işləyərkən aparılır.",
    ],
  },
  {
    id: "room-b3-302",
    slug: "b3-302-cad-laboratoriyasi",
    name: "CAD laboratoriyası 302",
    kind: "COMPUTER_LAB",
    ...B3, floor: 3, roomNumber: "302",
    capacity: 26, areaM2: 80,
    hue: "eng",
    summary: "Mühəndis qrafikası və 3D modelləşdirmə üçün geniş monitorlu 26 iş stansiyası.",
    description: [
      "CAD laboratoriyası mühəndis qrafikası, kompüter qrafikası və maşın hissələrinin layihələndirilməsi dərsləri üçündür. Hər iş yerində iki monitor var: birində çertyoj, digərində tapşırıq və standartlar açıq qalır.",
      "Təlim mərkəzinin «AutoCAD ilə mühəndis çertyojları» kursunun məşğələləri də bu laboratoriyada keçir. Hazır çertyojları A1 formatında plotterdə çap etmək mümkündür.",
    ],
    equipment: [
      "26 iş stansiyası (Intel Core i7, 32 GB RAM, NVIDIA RTX A2000, 2 monitor)",
      "Proqram təminatı: AutoCAD, SolidWorks, Autodesk Inventor, Revit (təhsil lisenziyaları)",
      "A1 formatlı plotter",
      "Proyektor və 3 m ekran",
      "Marker lövhəsi",
    ],
    amenities: ["COMPUTERS", "PROJECTOR", "WHITEBOARD", "AIR_CON", "WIFI"],
    layout: "LAB",
    openHours: { weekday: ["09:00", "20:00"], saturday: ["10:00", "17:00"] },
    rules: [
      ...BASE_RULES,
      "Laboratoriyada qida və içki qəbulu qadağandır.",
      "Plotterdə çap üçün faylları ən azı bir gün əvvəl laboranta göndərin.",
    ],
  },
  {
    id: "room-b4-201",
    slug: "b4-201-media-studiya",
    name: "Media studiya",
    kind: "STUDIO",
    ...B4, floor: 2, roomNumber: "201",
    capacity: 8, areaM2: 45,
    hue: "gold",
    summary: "Səs izolyasiyalı studiya: onlayn kurs çəkilişi, podkast və müsahibə yazısı.",
    description: [
      "Kitabxana-informasiya mərkəzindəki studiya ekspertlərin onlayn kurs videolarını, podkastları və müsahibələri çəkmək üçün qurulub. Otaq səs izolyasiyalıdır, divarlar akustik panellərlə örtülüb.",
      "Studiyada yaşıl fon, işıq dəsti, iki kamera və teleprompter var; montaj üçün ayrıca iş stansiyası quraşdırılıb. Çəkilişə studiyanın operatoru kömək edir.",
      "Onlayn kurs hazırlayan ekspertlər çəkiliş planını əvvəlcədən operatorla razılaşdırmalıdır — bir dərsin çəkilişi adətən 2 saat çəkir.",
    ],
    equipment: [
      "2 kamera (4K) və teleprompter",
      "Yaşıl fon və LED işıq dəsti",
      "Yaxa və studiya mikrofonları, səs pultu",
      "Montaj iş stansiyası (Adobe Premiere Pro, DaVinci Resolve)",
      "Akustik panellər, səs izolyasiyası",
    ],
    amenities: ["VIDEO_CONF", "AUDIO", "COMPUTERS", "AIR_CON", "WIFI"],
    layout: "BOARDROOM",
    openHours: { weekday: ["10:00", "19:00"], saturday: ["11:00", "17:00"] },
    rules: [
      ...BASE_RULES,
      "Çəkiliş yalnız studiya operatorunun iştirakı ilə aparılır.",
      "Çəkilmiş materialı eyni gün öz daşıyıcınıza köçürün — studiya kompüterində 7 gün saxlanılır.",
    ],
  },
  {
    id: "room-b4-307",
    slug: "b4-307-elmi-seminar-otagi",
    name: "Elmi seminar otağı 307",
    kind: "SEMINAR",
    ...B4, floor: 3, roomNumber: "307",
    capacity: 20, areaM2: 48,
    hue: "res",
    summary: "Kitabxananın sakit mərtəbəsində 20 yerlik otaq: elmi seminarlar və tədqiqat qrupları.",
    description: [
      "Kitabxana-informasiya mərkəzinin üçüncü mərtəbəsindəki otaq magistrantların, doktorantların və tədqiqat qruplarının seminarları üçündür. Kitabxananın elektron bazalarına buradan birbaşa giriş var.",
      "Akademik yazı, tədqiqat metodologiyası və məqalə müzakirələri kimi kiçik qrup məşğələləri üçün əlverişlidir. Otaq kitabxananın iş saatlarında açıqdır.",
    ],
    equipment: [
      "65 düymlük ekran və simsiz ekran paylaşımı",
      "Oval masa (20 yer)",
      "Marker lövhəsi",
      "Elektron elmi bazalara giriş (Scopus, Web of Science, ScienceDirect)",
      "Kondisioner",
    ],
    amenities: ["WHITEBOARD", "AIR_CON", "ACCESSIBLE", "WIFI"],
    layout: "BOARDROOM",
    openHours: { weekday: ["09:00", "20:00"], saturday: ["10:00", "18:00"] },
    rules: [...BASE_RULES, "Kitabxananın sakitlik qaydalarına əməl edin: qapını bağlı saxlayın."],
  },
];

// ---------------------------------------------------------------- lookups

/** A sample room by its slug, or null. */
export function roomBySlug(slug: string): Room | null {
  return ROOMS.find((r) => r.slug === slug) ?? null;
}

// ---------------------------------------------------------------- "now" in Baku (server only)

/*
 * The calendar, "next free slot" and reservation checks all need Baku's date
 * and time. They are computed once on the server and handed to client
 * components as strings, so the browser's clock and time zone never decide
 * what is rendered (no hydration mismatch). "en-CA" and "en-GB" formatting
 * data ship with every Node build, unlike "az".
 */
function partsIn(tz: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** Today's date in Baku (or `tz`) as "YYYY-MM-DD". Call on the server. */
export function todayISO(tz = "Asia/Baku"): string {
  const p = partsIn(tz);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Baku's date and time right now: { date: "YYYY-MM-DD", time: "HH:MM" }. Call on the server. */
export function nowInBaku(tz = "Asia/Baku"): { date: string; time: string } {
  const p = partsIn(tz);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}
