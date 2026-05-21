import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Zap, Shield, Smartphone, Activity, ArrowLeft,
  CheckCircle2, Plug, BarChart3, MessageSquare, Lock, Bot, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جوهر باي — منصة تأكيد المدفوعات للتجار في مصر" },
      { name: "description", content: "أكّد حوالات المحافظ والإنستا باي فوريًا. لوحة عمليات متكاملة بالعربية، مع ربط WooCommerce وAPI وWebhooks موقّعة." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <Hero />
      <TrustBar />
      <Features />
      <DashboardPreview />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <FutureModule />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex items-center px-4 sm:px-6 h-14 sm:h-16 gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-xl bg-hero-gradient grid place-items-center text-white shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg truncate">جوهر باي</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 mr-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">المميزات</a>
          <a href="#preview" className="hover:text-foreground transition">اللوحة</a>
          <a href="#pricing" className="hover:text-foreground transition">الباقات</a>
          <a href="#faq" className="hover:text-foreground transition">الأسئلة</a>
          <a href="#contact" className="hover:text-foreground transition">اتصل بنا</a>
        </nav>
        <div className="flex-1" />
        <Link to="/login"><Button variant="ghost" size="sm" className="px-3 text-xs sm:text-sm">دخول</Button></Link>
        <Link to="/signup"><Button size="sm" className="px-3 sm:px-4 text-xs sm:text-sm">ابدأ مجانًا</Button></Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden glow-grid">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 backdrop-blur px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs text-muted-foreground mb-5 shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          منصة تأكيد المدفوعات الأولى للسوق المصري
        </div>
        <h1 className="font-display text-[2rem] leading-[1.15] sm:text-5xl md:text-6xl font-extrabold text-balance">
          أكّد كل حوالة
          <br className="sm:hidden" />
          <span className="bg-hero-gradient bg-clip-text text-transparent"> فودافون كاش وإنستا باي </span>
          <br />
          في أقل من 5 ثواني
        </h1>
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
          منصة عمليات متكاملة بالعربية. اربط حساباتك، اقرأ رسائل المحفظة لحظيًا، طابق طلباتك تلقائيًا، وأرسل تأكيد فوري لمتجرك.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 shadow-elegant">
              ابدأ تجربتك المجانية <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#preview" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">شاهد اللوحة</Button>
          </a>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">14 يوم تجربة • بدون بطاقة ائتمان • إلغاء في أي وقت</div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {[
            ["< 5ث", "زمن التأكيد"],
            ["99.7%", "دقة التحليل"],
            ["+12", "مزود مدعوم"],
            ["24/7", "مراقبة لحظية"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl border bg-card/60 backdrop-blur p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-primary">{n}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = ["فودافون كاش", "إنستا باي", "اتصالات كاش", "أورنج كاش", "WE Pay", "InstaPay", "بنك CIB", "QNB"];
  return (
    <div className="border-y bg-muted/30 py-6 overflow-hidden">
      <div className="text-center text-xs text-muted-foreground mb-3">مدعوم لأكثر من 12 مزود دفع مصري</div>
      <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap px-4 text-sm font-medium text-muted-foreground/80">
        {items.map((i) => <span key={i}>{i}</span>)}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Zap, title: "تأكيد فوري", desc: "تأكيد الحوالة لحظة استلام رسالة المحفظة، مع مطابقة تلقائية للطلب." },
    { icon: Shield, title: "حماية ومخاطر", desc: "كشف الرسائل المكررة، تتبّع الأرصدة، وقواعد مخاطر قابلة للضبط." },
    { icon: Bot, title: "ذكاء اصطناعي عربي", desc: "ترجمة وتحليل الرسائل بالعامية المصرية مع درجة ثقة لكل حركة." },
    { icon: Smartphone, title: "أجهزة متعددة", desc: "ادعم خطوطًا وأجهزة أندرويد متعددة مع حالة اتصال لحظية." },
    { icon: Plug, title: "WooCommerce + API", desc: "إضافة جاهزة لمتجرك، REST API، وWebhooks موقّعة بـ HMAC-SHA256." },
    { icon: MessageSquare, title: "تيليجرام + واتساب", desc: "بوت تيليجرام لكل تاجر يستعرض الرصيد والحوالات بأمر واحد." },
    { icon: BarChart3, title: "تحليلات تشغيلية", desc: "لوحات يومية وشهرية تكشف أنماط البيع وتدفق النقد." },
    { icon: Lock, title: "عزل تام للبيانات", desc: "Row-Level Security على كل جدول. تاجرك لا يرى بيانات تاجر آخر أبدًا." },
  ];
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="المميزات" title="بنية تشغيلية كاملة للتاجر المصري" />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card-gradient p-5 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section id="preview" className="py-20 sm:py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="اللوحة" title="كل عملياتك في شاشة واحدة" />
        <div className="mt-12 rounded-2xl border bg-card shadow-elegant overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
            <span className="h-3 w-3 rounded-full bg-destructive/60" />
            <span className="h-3 w-3 rounded-full bg-warning/60" />
            <span className="h-3 w-3 rounded-full bg-success/60" />
            <span className="text-xs text-muted-foreground mr-auto" dir="ltr">app.goharpay.com/app</span>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-background">
            {[
              { l: "إجمالي اليوم", v: "84,250 ج.م", i: TrendingUp, c: "text-success" },
              { l: "حوالات مؤكدة", v: "147", i: CheckCircle2, c: "text-primary" },
              { l: "قيد المراجعة", v: "8", i: Activity, c: "text-warning" },
              { l: "أجهزة متصلة", v: "3", i: Smartphone, c: "text-primary" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border bg-card-gradient p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{k.l}</span>
                  <k.i className={`h-4 w-4 ${k.c}`} />
                </div>
                <div className="mt-2 text-lg sm:text-2xl font-bold font-display tabular-nums">{k.v}</div>
              </div>
            ))}
          </div>
          <div className="px-4 sm:px-6 pb-6 bg-background">
            <div className="rounded-xl border bg-card">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-sm">آخر الحوالات</h4>
                <span className="text-[10px] text-muted-foreground">مباشر</span>
              </div>
              <div className="divide-y text-sm">
                {[
                  ["فودافون كاش", "1,250 ج.م", "REF293841", "success", "مؤكدة"],
                  ["إنستا باي", "3,400 ج.م", "REF293842", "success", "مؤكدة"],
                  ["اتصالات كاش", "850 ج.م", "REF293843", "warning", "قيد المراجعة"],
                  ["فودافون كاش", "2,100 ج.م", "REF293844", "success", "مؤكدة"],
                ].map(([prov, amt, ref, tone, status], i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full bg-${tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{prov} — {amt}</div>
                      <div className="text-[11px] text-muted-foreground" dir="ltr">{ref}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded bg-${tone}/10 text-${tone} hidden sm:inline`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "أنشئ حسابك", d: "إيميل وكلمة مرور. سنحضّر لوحتك التجريبية وبياناتك في ثوانٍ." },
    { n: "02", t: "اربط حساباتك", d: "أضف خطوطك (محافظ / إنستا باي / SMS بنكي) واضبط قواعد المطابقة." },
    { n: "03", t: "ابدأ التأكيد التلقائي", d: "كل رسالة تصل تُحلّل وتُطابق فورًا، ويُحدَّث طلبك عبر API أو Webhook." },
  ];
  return (
    <section className="py-20 sm:py-24 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="آلية العمل" title="3 خطوات لتفعيل التأكيد التلقائي" />
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border bg-card p-6 relative overflow-hidden">
              <div className="text-5xl font-display font-bold text-primary/15 absolute top-2 left-4">{s.n}</div>
              <div className="relative">
                <h3 className="font-semibold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = ["متاجر WooCommerce", "متاجر الخدمات الرقمية", "شحن الألعاب", "الاشتراكات الشهرية", "المنتجات الرقمية", "كورسات أونلاين", "خدمات التوصيل", "محلات التجزئة"];
  return (
    <section className="py-20 sm:py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="استخدامات" title="مصمم لكل تاجر يستلم دفعات إلكترونية" />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {cases.map((c) => (
            <div key={c} className="rounded-xl border bg-card px-4 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-sm">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "المبتدئ", price: "299", line: "خط واحد + جهاز", features: ["تأكيد فوري", "API + Webhooks", "دعم بالبريد", "1000 حوالة/شهر"] },
    { name: "النمو", price: "799", popular: true, line: "حتى 3 خطوط", features: ["كل مزايا المبتدئ", "WooCommerce", "محرك تحليل ذكي", "بوت تيليجرام", "دعم ذو أولوية"] },
    { name: "المؤسسة", price: "2,499", line: "حتى 20 خطًا", features: ["كل مزايا النمو", "SSO + SAML", "اتفاقية مستوى خدمة", "مدير حساب مخصّص", "حوالات غير محدودة"] },
  ];
  return (
    <section id="pricing" className="py-20 sm:py-24 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="الباقات" title="أسعار شفافة. ألغِ في أي وقت." />
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-6 transition-all ${p.popular ? "bg-card-gradient border-primary shadow-elegant md:-translate-y-2" : "bg-card hover:shadow-soft"}`}>
              {p.popular && <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> الأكثر شعبية</div>}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">ج.م / شهر</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{p.line}</div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-6">
                <Button className="w-full" variant={p.popular ? "default" : "outline"}>ابدأ الآن</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FutureModule() {
  return (
    <section className="py-16 border-t">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs rounded-full border bg-card px-3 py-1 mb-4">
          <Sparkles className="h-3 w-3 text-primary" /> قريباً
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">وحدة التحويلات الذكية</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          تحويل من المحفظة إلى الكاش، البنك، أو الإنستا باي ضمن نفس المنصة — مع تحكّم كامل في المخاطر والامتثال.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const qa = [
    ["هل المنصة مرخّصة كمؤسسة مالية؟", "جوهر باي منصة لتأكيد المدفوعات وعمليات التاجر، ولا تقدّم خدمات مالية منظّمة. أنت كتاجر تستلم على حسابك الخاص."],
    ["كيف يصل تأكيد الحوالة؟", "عبر جهاز التحصيل (أندرويد) الذي يقرأ رسائل المحفظة أو الإنستا باي، ويُرسلها مشفّرة إلى المنصة لتحليلها فورًا."],
    ["هل بياناتي معزولة عن باقي التجار؟", "نعم. نستخدم Row-Level Security على مستوى قاعدة البيانات. كل تاجر له workspace منفصل تمامًا، ولا يمكن لأي شخص آخر رؤية بياناتك."],
    ["هل أحتاج إنترنت دائم على الجهاز؟", "التطبيق مصمم للعمل في ظروف الشبكة الضعيفة مع إعادة محاولة وذاكرة تخزين محلية. الرسائل لا تُفقد أبدًا."],
    ["هل يمكن الربط مع متجري؟", "نعم. لدينا إضافة WooCommerce جاهزة، REST API كامل، وWebhooks موقّعة بـ HMAC-SHA256."],
    ["ما هي تكلفة الإعداد؟", "صفر. سجّل الآن، اختر باقتك، وابدأ خلال 5 دقائق. التجربة المجانية 14 يوم بدون بطاقة."],
  ];
  return (
    <section id="faq" className="py-20 sm:py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="الأسئلة الشائعة" title="إجابات على أكثر ما يُسأل" />
        <div className="mt-10 space-y-3">
          {qa.map(([q, a]) => (
            <details key={q} className="group rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors">
              <summary className="cursor-pointer font-medium flex items-center justify-between gap-4">
                <span>{q}</span>
                <span className="text-muted-foreground group-open:rotate-180 transition shrink-0">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 border-t">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-hero-gradient p-8 sm:p-12 text-center text-white shadow-elegant">
          <h2 className="font-display text-2xl sm:text-4xl font-bold">جاهز تأكّد كل حوالة فوريًا؟</h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">سجّل الآن واحصل على لوحتك التجريبية الكاملة في أقل من دقيقة.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2">ابدأ مجانًا <ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">لدي حساب</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-hero-gradient grid place-items-center text-white">
            <Sparkles className="h-3 w-3" />
          </div>
          © {new Date().getFullYear()} جوهر باي. جميع الحقوق محفوظة.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">سياسة الخصوصية</a>
          <a href="#" className="hover:text-foreground">الشروط</a>
          <a href="#" className="hover:text-foreground">تواصل</a>
        </div>
      </div>
    </footer>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-primary font-semibold tracking-[0.2em] uppercase">{eyebrow}</div>
      <h2 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-balance max-w-2xl mx-auto leading-tight">{title}</h2>
    </div>
  );
}
