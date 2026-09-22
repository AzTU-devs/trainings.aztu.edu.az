import type { Category } from "@/features/category/types";
import type { Course, CourseLevel, CourseModule, CourseSummary, CourseType, LessonContentType } from "@/features/course/types";

/*
 * SAMPLE CONTENT — not real courses, experts or reviews.
 *
 * The owner asked for the new design to be shown with the prototype's sample
 * catalogue for now, instead of the platform's real data. Everything here is
 * shaped exactly like the API's responses, so the pages render it with the
 * same components they use for real data, and switching back is one flag
 * (see ./flag.ts). Nothing in this file is sent to or stored by the API.
 */

// ---------------------------------------------------------------- categories
// Ids are UUID-shaped because the catalogue's URL parser only accepts UUIDs
// for `categoryId` (filters.ts), exactly as the API does.

type MockCategory = Category & { short: { az: string; en: string } };

const cat = (id: string, slug: string, name: string, sortOrder: number, az: string, en: string): MockCategory => ({
  id,
  parentId: null,
  slug,
  name,
  description: null,
  iconUrl: null,
  sortOrder,
  active: true,
  short: { az, en },
});

export const MOCK_CATEGORIES: MockCategory[] = [
  cat("0a2e7c00-5e0c-4a5e-8000-000000000001", "information-technology", "Information Technology", 1, "İT", "IT"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000002", "data-ai", "Data & Artificial Intelligence", 2, "Data və Aİ", "Data & AI"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000003", "engineering", "Engineering", 3, "Mühəndislik", "Engineering"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000004", "business-and-management", "Business & Management", 4, "Biznes", "Business"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000005", "research-academic-skills", "Research & Academic Skills", 5, "Tədqiqat", "Research"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000006", "construction-architecture", "Construction & Architecture", 6, "Tikinti", "Construction"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000007", "transport-logistics", "Transport & Logistics", 7, "Logistika", "Logistics"),
  cat("0a2e7c00-5e0c-4a5e-8000-000000000008", "energy-ecology", "Energy & Ecology", 8, "Energetika", "Energy"),
];

// ---------------------------------------------------------------- experts

export type MockExpert = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  headline: string;
  categoryId: string;
  years: number;
  bio?: string;
  languages?: string;
};

export const MOCK_EXPERTS: MockExpert[] = [
  { id: "e1", firstName: "Aynur", lastName: "Məmmədova", title: "Dosent, t.e.n.", department: "Kompüter mühəndisliyi kafedrası", headline: "Məlumat elmi və maşın öyrənməsi", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000002", years: 12,
    bio: "Məlumat elmi üzrə 12 illik tədris və tədqiqat təcrübəsi. Kurslarında hər mövzunu açıq məlumat dəstləri üzərində kiçik, tamamlanmış tapşırıqlarla möhkəmləndirir.", languages: "Azərbaycan, ingilis, rus" },
  { id: "e2", firstName: "Elçin", lastName: "Hüseynov", title: "Professor", department: "İnformasiya texnologiyaları kafedrası", headline: "Süni intellekt və robototexnika", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000002", years: 21 },
  { id: "e3", firstName: "Günel", lastName: "Əliyeva", title: "Baş müəllim", department: "İqtisadiyyat və idarəetmə kafedrası", headline: "Layihə idarəetməsi və maliyyə", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000004", years: 9 },
  { id: "e4", firstName: "Tural", lastName: "Abbasov", title: "Dosent", department: "Mexanika kafedrası", headline: "Mühəndis qrafikası və CAD", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000003", years: 15,
    bio: "Mühəndis qrafikası və avtomatlaşdırılmış layihələndirmə üzrə 15 illik təcrübə. Sənaye müəssisələri üçün texniki sənədləşmə layihələrində iştirak edib.", languages: "Azərbaycan, rus" },
  { id: "e5", firstName: "Rəşad", lastName: "Quliyev", title: "Baş müəllim", department: "Proqram mühəndisliyi kafedrası", headline: "Veb və backend proqramlaşdırma", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000001", years: 8,
    bio: "Veb və backend proqramlaşdırma üzrə 8 illik təcrübə. Kurslarında nəzəriyyəni kiçik, real layihələrlə birləşdirir.", languages: "Azərbaycan, ingilis" },
  { id: "e6", firstName: "Nigar", lastName: "Səfərova", title: "Dosent, PhD", department: "Elmi tədqiqatlar şöbəsi", headline: "Akademik yazı və metodologiya", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000005", years: 11 },
  { id: "e7", firstName: "Kamran", lastName: "İsmayılov", title: "Baş müəllim", department: "Memarlıq və inşaat kafedrası", headline: "BIM və konstruksiyaların modelləşdirilməsi", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000006", years: 7 },
  { id: "e8", firstName: "Leyla", lastName: "Həsənova", title: "Dosent", department: "Nəqliyyat logistikası kafedrası", headline: "Təchizat zənciri və nəqliyyat planlaşdırması", categoryId: "0a2e7c00-5e0c-4a5e-8000-000000000007", years: 13 },
];

export const expertName = (e: MockExpert) => `${e.firstName} ${e.lastName}`;

// ---------------------------------------------------------------- courses

type Seed = {
  id: string;
  slug: string;
  title: string;
  sub: string;
  cat: string;
  type: CourseType;
  level: CourseLevel;
  minutes: number;
  rating: number;
  ratings: number;
  enrolled: number;
  expert: string;
  photo?: string;
  /** Days since publication; under three weeks shows the "New" pill. */
  age: number;
};

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

const SEEDS: Seed[] = [
  { id: "python", slug: "python-ile-melumat-analizi", title: "Python ilə məlumat analizi", sub: "pandas, NumPy və vizuallaşdırma kitabxanaları ilə real məlumat dəstlərindən əsaslandırılmış nəticə çıxarmağı öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000002", type: "ONLINE", level: "BEGINNER", minutes: h(12, 40), rating: 4.8, ratings: 64, enrolled: 412, expert: "e1", age: 1 },
  { id: "pm", slug: "layihe-idareetmesinin-esaslari", title: "Layihə idarəetməsinin əsasları", sub: "Layihəni başlanğıcdan bağlanışa qədər planlaşdırmağı, komandanı və riskləri idarə etməyi auditoriyada, real keyslər üzərində öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000004", type: "OFFLINE", level: "ALL", minutes: h(24), rating: 4.9, ratings: 21, enrolled: 38, expert: "e3", photo: "/showcase/pm.jpg", age: 25 },
  { id: "ai", slug: "suni-intellekte-giris", title: "Süni intellektə giriş", sub: "Süni intellektin əsas ideyalarını, tətbiq sahələrini və məhdudiyyətlərini sadə nümunələrlə öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000002", type: "ONLINE", level: "BEGINNER", minutes: h(8), rating: 4.7, ratings: 38, enrolled: 290, expert: "e2", age: 6 },
  { id: "autocad", slug: "autocad-ile-muhendis-certyojlari", title: "AutoCAD ilə mühəndis çertyojları", sub: "Texniki çertyojları standartlara uyğun hazırlamağı iki ölçülü çəkilişdən çapa qədər öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000003", type: "OFFLINE", level: "INTERMEDIATE", minutes: h(30), rating: 4.8, ratings: 17, enrolled: 36, expert: "e4", age: 40 },
  { id: "web", slug: "veb-proqramlasdirmanin-esaslari", title: "Veb proqramlaşdırmanın əsasları: HTML, CSS və JavaScript", sub: "Heç bir təcrübə olmadan ilk responsiv veb saytınızı sıfırdan qurun və dərc edin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000001", type: "ONLINE", level: "BEGINNER", minutes: h(9, 20), rating: 4.6, ratings: 52, enrolled: 530, expert: "e5", photo: "/showcase/laptop.jpg", age: 48 },
  { id: "paper", slug: "elmi-meqale-yazmaq", title: "Elmi məqalə yazmaq: strukturdan nəşrə", sub: "Elmi məqaləni planlaşdırmağı, yazmağı və jurnala təqdim etməyi addım-addım öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000005", type: "ONLINE", level: "INTERMEDIATE", minutes: h(6), rating: 4.9, ratings: 12, enrolled: 140, expert: "e6", age: 55 },
  { id: "bim", slug: "bim-ve-revit-ile-modellesdirme", title: "BIM və Revit ilə memarlıq modelləşdirməsi", sub: "Binanın informasiya modelini qurmağı və fənlərarası koordinasiyanı Revit-də öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000006", type: "OFFLINE", level: "INTERMEDIATE", minutes: h(36), rating: 4.7, ratings: 9, enrolled: 24, expert: "e7", age: 60 },
  { id: "scm", slug: "techizat-zencirinin-idare-edilmesi", title: "Təchizat zəncirinin idarə edilməsi", sub: "Anbar, nəqliyyat və tələbin planlaşdırılmasını real keyslər üzərində öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000007", type: "ONLINE", level: "INTERMEDIATE", minutes: h(7, 30), rating: 4.5, ratings: 14, enrolled: 160, expert: "e8", age: 70 },
  { id: "sec", slug: "kibertehlukesizliyin-esaslari", title: "Kibertəhlükəsizliyin əsasları", sub: "Şəbəkə və proqram təhlükəsizliyinin əsas anlayışlarını, hücum növlərini və qorunma üsullarını öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000001", type: "ONLINE", level: "BEGINNER", minutes: h(5, 45), rating: 4.8, ratings: 41, enrolled: 380, expert: "e5", age: 80 },
  { id: "ml", slug: "masin-oyrenmesi-praktiki-kurs", title: "Maşın öyrənməsi: praktiki kurs", sub: "Klassik maşın öyrənməsi alqoritmlərini scikit-learn ilə real məsələlərdə tətbiq edin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000002", type: "ONLINE", level: "ADVANCED", minutes: h(16), rating: 4.9, ratings: 29, enrolled: 210, expert: "e1", photo: "/showcase/data.jpg", age: 90 },
  { id: "solar", slug: "gunes-enerjisi-sistemleri", title: "Günəş enerjisi sistemlərinin layihələndirilməsi", sub: "Fotovoltaik sistemlərin hesablanmasını, komponentlərin seçimini və quraşdırılmasını öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000008", type: "OFFLINE", level: "INTERMEDIATE", minutes: h(20), rating: 0, ratings: 0, enrolled: 12, expert: "e4", age: 2 },
  { id: "sql", slug: "sql-ve-verilenler-bazalari", title: "SQL və verilənlər bazalarının əsasları", sub: "Relyasiya verilənlər bazalarını layihələndirməyi və SQL sorğuları yazmağı öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000001", type: "ONLINE", level: "BEGINNER", minutes: h(6, 10), rating: 4.7, ratings: 33, enrolled: 260, expert: "e5", age: 100 },
  { id: "mech", slug: "materiallar-muqavimeti", title: "Materiallar müqaviməti", sub: "Gərginlik, deformasiya və möhkəmlik hesablamalarını mühəndis məsələləri üzərində öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000003", type: "ONLINE", level: "ADVANCED", minutes: h(14), rating: 4.6, ratings: 8, enrolled: 90, expert: "e4", age: 110 },
  { id: "fin", slug: "maliyye-savadliligi", title: "Maliyyə savadlılığı və büdcələmə", sub: "Şəxsi və komanda büdcəsini planlaşdırmağı, xərcləri və investisiya risklərini qiymətləndirməyi öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000004", type: "ONLINE", level: "BEGINNER", minutes: h(4, 30), rating: 4.8, ratings: 19, enrolled: 175, expert: "e3", age: 120 },
  { id: "urban", slug: "seher-neqliyyatinin-planlasdirilmasi", title: "Şəhər nəqliyyatının planlaşdırılması", sub: "Şəhər nəqliyyat şəbəkəsinin təhlilini və planlaşdırılmasını Bakı nümunələri üzərində öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000007", type: "OFFLINE", level: "ADVANCED", minutes: h(18), rating: 0, ratings: 0, enrolled: 8, expert: "e8", age: 5 },
  { id: "stat", slug: "tedqiqat-metodologiyasi-ve-statistika", title: "Tədqiqat metodologiyası və statistika", sub: "Tədqiqatı planlaşdırmağı, məlumat toplamağı və nəticələri statistik üsullarla yoxlamağı öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000005", type: "ONLINE", level: "ALL", minutes: h(10), rating: 4.7, ratings: 11, enrolled: 120, expert: "e6", age: 130 },
  { id: "eff", slug: "binalarda-enerji-semereliliyi", title: "Binalarda enerji səmərəliliyi", sub: "Binaların enerji istehlakını qiymətləndirməyi və səmərəlilik tədbirlərini seçməyi öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000008", type: "ONLINE", level: "BEGINNER", minutes: h(5), rating: 4.6, ratings: 6, enrolled: 64, expert: "e7", age: 140 },
  { id: "struct", slug: "demir-beton-konstruksiyalar", title: "Dəmir-beton konstruksiyaların hesablanması", sub: "Dəmir-beton elementlərin normativlərə uyğun hesablanmasını praktik nümunələrlə öyrənin.", cat: "0a2e7c00-5e0c-4a5e-8000-000000000006", type: "ONLINE", level: "ADVANCED", minutes: h(15, 20), rating: 4.8, ratings: 7, enrolled: 52, expert: "e7", age: 150 },
];

const DAY = 24 * 60 * 60 * 1000;

function summary(s: Seed, now: number): CourseSummary {
  const e = MOCK_EXPERTS.find((x) => x.id === s.expert)!;
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    subtitle: s.sub,
    courseType: s.type,
    level: s.level,
    language: "az",
    free: true,
    price: "0",
    currency: "AZN",
    status: "PUBLISHED",
    ratingAvg: String(s.rating),
    ratingCount: s.ratings,
    enrolledCount: s.enrolled,
    tutorId: e.id,
    tutorDisplayName: expertName(e),
    publishedAt: new Date(now - s.age * DAY).toISOString(),
    totalDurationSec: s.minutes * 60,
    thumbnailUrl: s.photo ?? null,
  };
}

/** Every sample course, newest first (the API's default order). */
export function mockCourses(now: number = Date.now()): CourseSummary[] {
  return [...SEEDS].sort((a, b) => a.age - b.age).map((s) => summary(s, now));
}

export function mockCategoryOf(courseId: string): string | null {
  return SEEDS.find((s) => s.id === courseId)?.cat ?? null;
}

// ---------------------------------------------------------------- details

type L = [LessonContentType, string, number, boolean?];
type M = [string, L[]];

/** Module plans per subject, used for every sample course without its own. */
const PLANS: Record<string, M[]> = {
  "0a2e7c00-5e0c-4a5e-8000-000000000001": [
    ["Giriş və iş mühiti", [["VIDEO", "Kursa xoş gəlmisiniz", 4, true], ["VIDEO", "Alətlərin quraşdırılması", 12, true], ["QUIZ", "Yoxlama testi", 5]]],
    ["Əsas anlayışlar", [["VIDEO", "Struktur və sintaksis", 16], ["VIDEO", "Praktik nümunələr", 20], ["TEXT", "Qısa xülasə", 8]]],
    ["Layihə", [["VIDEO", "Layihənin təsviri", 10], ["PDF", "Tapşırıq", 0], ["VIDEO", "Nümunə həll", 28]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000002": [
    ["Giriş və iş mühiti", [["VIDEO", "Kursa xoş gəlmisiniz", 4, true], ["VIDEO", "Python və Jupyter", 13, true], ["TEXT", "İlk notebook", 8], ["QUIZ", "Yoxlama testi", 5]]],
    ["Məlumatla iş", [["VIDEO", "Məlumatı oxumaq və təmizləmək", 18], ["VIDEO", "Qruplaşdırma və birləşdirmə", 24], ["LIVE_SESSION", "Canlı sual-cavab", 60]]],
    ["Model və nəticə", [["VIDEO", "Modelin qurulması", 22], ["VIDEO", "Nəticələrin qiymətləndirilməsi", 19], ["PDF", "Yekun tapşırıq", 0]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000003": [
    ["Əsaslar", [["VIDEO", "Kursa giriş", 6, true], ["VIDEO", "Standartlar və qaydalar", 14], ["TEXT", "Terminlər lüğəti", 10]]],
    ["Praktika", [["LIVE_SESSION", "Laboratoriya məşğələsi", 180], ["VIDEO", "Nümunə məsələlər", 25], ["QUIZ", "Yoxlama testi", 10]]],
    ["Yekun iş", [["PDF", "Tapşırıq", 0], ["LIVE_SESSION", "Təqdimat", 120]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000004": [
    ["Əsaslar", [["VIDEO", "Kursa giriş", 5, true], ["VIDEO", "Əsas anlayışlar", 15], ["TEXT", "Şablonlar", 10]]],
    ["Planlaşdırma", [["VIDEO", "Plan və büdcə", 20], ["VIDEO", "Risklər", 18], ["QUIZ", "Yoxlama testi", 8]]],
    ["Tətbiq", [["LIVE_SESSION", "Keys müzakirəsi", 90], ["PDF", "Yekun tapşırıq", 0]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000005": [
    ["Tədqiqatın qurulması", [["VIDEO", "Kursa giriş", 5, true], ["VIDEO", "Sualın və hipotezin qoyulması", 17], ["TEXT", "Yoxlama siyahısı", 8]]],
    ["Metodlar", [["VIDEO", "Məlumat toplama", 19], ["VIDEO", "Statistik yoxlama", 23], ["QUIZ", "Yoxlama testi", 8]]],
    ["Nəşr", [["VIDEO", "Məqalənin strukturu", 21], ["PDF", "Jurnal seçimi bələdçisi", 0]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000006": [
    ["Giriş", [["VIDEO", "Kursa giriş", 6, true], ["VIDEO", "Normativlər", 18], ["TEXT", "Terminlər", 10]]],
    ["Modelləşdirmə", [["LIVE_SESSION", "Praktik məşğələ", 180], ["VIDEO", "Nümunə layihə", 30]]],
    ["Yekun layihə", [["PDF", "Tapşırıq", 0], ["LIVE_SESSION", "Layihələrin təqdimatı", 120]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000007": [
    ["Giriş", [["VIDEO", "Kursa giriş", 5, true], ["VIDEO", "Əsas anlayışlar", 16]]],
    ["Planlaşdırma", [["VIDEO", "Tələbin proqnozu", 20], ["VIDEO", "Marşrut və anbar", 22], ["QUIZ", "Yoxlama testi", 8]]],
    ["Keyslər", [["LIVE_SESSION", "Bakı nümunələri", 90], ["PDF", "Yekun tapşırıq", 0]]],
  ],
  "0a2e7c00-5e0c-4a5e-8000-000000000008": [
    ["Giriş", [["VIDEO", "Kursa giriş", 6, true], ["VIDEO", "Enerji balansı", 18]]],
    ["Hesablamalar", [["VIDEO", "Sistemlərin hesablanması", 24], ["TEXT", "Hesablama cədvəli", 12], ["QUIZ", "Yoxlama testi", 8]]],
    ["Layihə", [["LIVE_SESSION", "Praktik məşğələ", 120], ["PDF", "Yekun tapşırıq", 0]]],
  ],
};

const DETAILS: Record<string, { outcomes: string[]; desc: string[]; reqs: string[]; modules?: M[] }> = {
  python: {
    outcomes: ["Python-da məlumatla işləmək üçün iş mühitini qurmaq", "pandas ilə cədvəl məlumatını oxumaq, təmizləmək və birləşdirmək", "NumPy ilə vektor hesablamaları aparmaq", "Matplotlib və seaborn ilə aydın qrafiklər qurmaq", "Təsviri statistika ilə qanunauyğunluqları tapmaq", "Kiçik analitik layihəni başdan sona hazırlamaq"],
    desc: ["Bu kurs proqramlaşdırma təcrübəsi olmayanlar üçün hazırlanıb. İlk dərsdə iş mühitini quraşdırır, sonrakı modullarda isə Python-un analitik işlər üçün lazım olan hissəsini addım-addım öyrənirsiniz.", "Hər modul açıq məlumat dəstləri üzərində praktik tapşırıqla bitir. Kursun sonunda Bakı nəqliyyat məlumatı əsasında kiçik analitik hesabat hazırlayacaqsınız."],
    reqs: ["Kompüterlə əsas iş bacarığı", "Proqramlaşdırma təcrübəsi tələb olunmur", "Python quraşdırmaq üçün kompüter (quraşdırma dərsdə göstərilir)"],
    modules: [
      ["Giriş və iş mühiti", [["VIDEO", "Kursa xoş gəlmisiniz", 4, true], ["VIDEO", "Python və Jupyter-in quraşdırılması", 13, true], ["TEXT", "İlk notebook", 8], ["QUIZ", "Yoxlama testi", 5]]],
      ["Python əsasları", [["VIDEO", "Dəyişənlər və tiplər", 14], ["VIDEO", "Siyahılar və lüğətlər", 18], ["VIDEO", "Şərtlər və dövrlər", 16], ["VIDEO", "Funksiyalar", 21], ["PDF", "Praktik tapşırıq", 0]]],
      ["pandas ilə məlumat", [["VIDEO", "DataFrame nədir", 15], ["VIDEO", "CSV və Excel fayllarını oxumaq", 17], ["VIDEO", "Boş və təkrarlanan qiymətlər", 22], ["VIDEO", "Qruplaşdırma və birləşdirmə", 24], ["LIVE_SESSION", "Canlı sual-cavab", 60]]],
      ["Vizuallaşdırma", [["VIDEO", "Matplotlib əsasları", 20], ["VIDEO", "seaborn ilə statistik qrafiklər", 21], ["TEXT", "Qrafik seçimi: yaddaş vərəqi", 10], ["QUIZ", "Yoxlama testi", 8]]],
      ["Yekun layihə", [["VIDEO", "Layihənin təsviri", 10], ["PDF", "Məlumat dəsti və tapşırıq", 0], ["VIDEO", "Nümunə həll", 32]]],
    ],
  },
  pm: {
    outcomes: ["Layihənin məqsədini, əhatəsini və nəticələrini dəqiq müəyyənləşdirmək", "İş bölgüsü strukturu (WBS) və təqvim planı qurmaq", "Gantt diaqramı ilə tapşırıqları və asılılıqları idarə etmək", "Riskləri qiymətləndirmək və cavab planı hazırlamaq", "Maraqlı tərəflərlə ünsiyyət planı qurmaq", "Layihəni bağlamaq və nəticələri təhlil etmək"],
    desc: ["Kurs auditoriyada, kiçik qrupla keçirilir. Hər mövzu real layihə nümunəsi üzərində, qrup tapşırıqları ilə möhkəmləndirilir.", "Layihə komandalarında çalışan və ya ilk layihəsinə rəhbərlik edəcək mütəxəssislər, həmçinin yuxarı kurs tələbələri üçün uyğundur."],
    reqs: ["Xüsusi hazırlıq tələb olunmur", "Dərslərə noutbukla gəlmək tövsiyə olunur", "Binaya giriş üçün şəxsiyyət vəsiqəsi"],
    modules: [
      ["Layihə və onun həyat dövrü", [["LIVE_SESSION", "Layihə nədir: məqsəd, əhatə, məhdudiyyətlər", 180], ["PDF", "Layihə nizamnaməsi şablonu", 0]]],
      ["Planlaşdırma", [["LIVE_SESSION", "İş bölgüsü strukturu (WBS)", 180], ["LIVE_SESSION", "Təqvim planı və Gantt diaqramı", 180], ["TEXT", "Qiymətləndirmə üsulları", 15]]],
      ["Risklər və keyfiyyət", [["LIVE_SESSION", "Risk reyestri və cavab planı", 180], ["QUIZ", "Yoxlama testi", 10]]],
      ["Komanda və ünsiyyət", [["LIVE_SESSION", "Rollar və məsuliyyət matrisi", 180], ["LIVE_SESSION", "Maraqlı tərəflərlə iş", 180]]],
      ["Yekun layihə", [["LIVE_SESSION", "Qrup layihələrinin təqdimatı", 180]]],
    ],
  },
};

const OFFLINE: Record<string, { start: string; end: string; weekly: string; total: string; seats: number; room: string }> = {
  pm: { start: "2026-10-06", end: "2026-11-24", weekly: "3", total: "24", seats: 40, room: "AzTU əsas korpusu, H. Cavid prospekti 25, 214-cü otaq" },
  autocad: { start: "2026-10-13", end: "2026-12-15", weekly: "4", total: "30", seats: 40, room: "AzTU əsas korpusu, H. Cavid prospekti 25, kompüter zalı 3" },
  bim: { start: "2026-10-20", end: "2027-01-19", weekly: "3", total: "36", seats: 30, room: "AzTU tədris korpusu, H. Cavid prospekti 25, 402-ci otaq" },
  solar: { start: "2026-11-03", end: "2026-12-22", weekly: "3", total: "20", seats: 24, room: "AzTU enerji laboratoriyası, H. Cavid prospekti 25" },
  urban: { start: "2026-11-10", end: "2027-01-12", weekly: "2", total: "18", seats: 20, room: "AzTU əsas korpusu, H. Cavid prospekti 25, 118-ci otaq" },
};

function modulesFrom(plan: M[], courseId: string): CourseModule[] {
  return plan.map(([title, lessons], mi) => ({
    id: `${courseId}-m${mi + 1}`,
    title,
    description: null,
    orderIndex: mi,
    lessons: lessons.map(([type, name, minutes, preview], li) => ({
      id: `${courseId}-m${mi + 1}-l${li + 1}`,
      title: name,
      description: null,
      contentType: type,
      videoUrl: null,
      durationSeconds: minutes * 60,
      orderIndex: li,
      preview: !!preview,
    })),
  }));
}

/** The full course page data for a sample course, or null. */
export function mockCourse(slug: string, now: number = Date.now()): Course | null {
  const s = SEEDS.find((x) => x.slug === slug);
  if (!s) return null;
  const base = summary(s, now);
  const d = DETAILS[s.id];
  const off = OFFLINE[s.id];
  return {
    ...base,
    description: (d?.desc ?? [s.sub]).join("\n\n"),
    requirements: (d?.reqs ?? ["Xüsusi hazırlıq tələb olunmur", "Kompüter və internet bağlantısı"]).join("\n"),
    learningOutcomes: (d?.outcomes ?? [
      "Mövzunun əsas anlayışlarını aydın başa düşmək",
      "Öyrəndiklərini praktik tapşırıqlarda tətbiq etmək",
      "Kiçik yekun layihəni müstəqil hazırlamaq",
      "Növbəti səviyyə üçün öyrənmə yolunu müəyyənləşdirmək",
    ]).join("\n"),
    syllabus: null,
    thumbnailMediaId: null,
    trailerMediaId: null,
    categoryIds: [s.cat],
    tagIds: [],
    onlineDetails: s.type === "ONLINE" ? { totalVideoSeconds: s.minutes * 60, hasCertificate: false, dripEnabled: false } : null,
    offlineDetails: off
      ? { startDate: off.start, endDate: off.end, weeklyHours: off.weekly, totalHours: off.total, studentLimit: off.seats, enrolledCount: s.enrolled, city: "Bakı", addressLine: off.room }
      : null,
    modules: modulesFrom(d?.modules ?? PLANS[s.cat] ?? PLANS["0a2e7c00-5e0c-4a5e-8000-000000000001"], s.id),
  };
}

// ---------------------------------------------------------------- reviews

export type MockReview = { name: string; initials: string; month: string; stars: number; text: string; k: string };

const REVIEWS: Record<string, MockReview[]> = {
  python: [
    { name: "Nərmin Q.", initials: "NQ", month: "avqust 2026", stars: 5, text: "Proqramlaşdırmanı heç bilmirdim, amma tapşırıqlar elə qurulub ki, hər modulun sonunda nəyi bacardığımı görürdüm. pandas bölməsi xüsusilə faydalı oldu.", k: "k-data" },
    { name: "Orxan M.", initials: "OM", month: "iyul 2026", stars: 5, text: "Dərslər qısa və konkretdir. Canlı sual-cavab sessiyası çətin qaldığım yerləri aydınlaşdırdı.", k: "k-it" },
    { name: "Səbinə H.", initials: "SH", month: "iyul 2026", stars: 4, text: "Məzmun çox yaxşıdır. Vizuallaşdırma modulunda bir az daha çox praktik nümunə olsaydı, daha yaxşı olardı.", k: "k-res" },
  ],
  pm: [
    { name: "Fərid Ə.", initials: "FƏ", month: "iyun 2026", stars: 5, text: "Qrup tapşırıqları sayəsində nəzəriyyə dərhal praktikaya çevrildi. Risk reyestrini artıq işdə istifadə edirəm.", k: "k-eng" },
    { name: "Aysel R.", initials: "AR", month: "may 2026", stars: 5, text: "Ekspert hər suala real layihələrdən nümunə ilə cavab verirdi. Dərslərin tempi çox rahat idi.", k: "k-build" },
  ],
};

/** Rating histogram 5→1 derived from the course's rating and count. */
export function mockReviews(courseId: string, ratingAvg: number, ratingCount: number) {
  if (ratingCount <= 0) return { histogram: [0, 0, 0, 0, 0], reviews: [] as MockReview[] };
  const five = Math.round(ratingCount * Math.min(1, Math.max(0, (ratingAvg - 3.9) / 1.1)));
  const four = Math.round((ratingCount - five) * 0.75);
  const three = Math.max(0, ratingCount - five - four);
  return { histogram: [five, four, three, 0, 0], reviews: REVIEWS[courseId] ?? [] };
}
