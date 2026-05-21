import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Zap, Shield, Smartphone, Activity, ArrowLeft,
  CheckCircle2, Plug, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جوهر باي — تأكيد المدفوعات الفوري للتجار" },
      { name: "description", content: "منصة متكاملة لتأكيد حوالات المحافظ والإنستا باي والمتابعة اللحظية للطلبات والمصالحة الذكية." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <FutureModule />
      <FAQ />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center px-4 sm:px-6 h-14 sm:h-16 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-hero-gradient grid place-items-center text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg truncate">جوهر باي</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 mr-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">المميزات</a>
          <a href="#how" className="hover:text-foreground">آلية العمل</a>
          <a href="#pricing" className="hover:text-foreground">الباقات</a>
          <a href="#faq" className="hover:text-foreground">الأسئلة</a>
        </nav>
        <div className="flex-1" />
        <Link to="/login"><Button variant="ghost" size="sm" className="px-2 sm:px-3">دخول</Button></Link>
        <Link to="/signup"><Button size="sm" className="px-2 sm:px-3">ابدأ</Button></Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden glow-grid">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs text-muted-foreground mb-6">
          <Activity className="h-3 w-3 text-primary" />
          بنية تأكيد مدفوعات للسوق المصري
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight text-balance">
          أكّد مدفوعاتك من المحافظ والإنستا باي
          <br />
          <span className="bg-hero-gradient bg-clip-text text-transparent">في ثوانٍ، بثقة كاملة</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          منصة عمليات متكاملة تربط جهاز التحصيل بحسابات تجارك، تحلّل رسائل التأكيد لحظيًا، وتُحدّث طلباتك تلقائيًا بأعلى معايير الأمان.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/signup"><Button size="lg" className="gap-2">ابدأ تجربتك المجانية <ArrowLeft className="h-4 w-4" /></Button></Link>
          <Button size="lg" variant="outline">احجز عرضًا توضيحيًا</Button>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            ["< 5ث", "زمن التأكيد"],
            ["99.7%", "دقة التحليل"],
            ["+12", "مزود مدعوم"],
            ["24/7", "مراقبة لحظية"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-primary">{n}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Zap, title: "تأكيد فوري", desc: "تأكيد الحوالة لحظة استلام رسالة الإشعار من المحفظة أو الإنستا باي." },
    { icon: Shield, title: "حماية ومخاطر", desc: "كشف الرسائل المكررة، تتبّع الأرصدة، وقواعد مخاطر قابلة للضبط." },
    { icon: Smartphone, title: "أجهزة تحصيل متعددة", desc: "ادعم خطوطًا متعددة وأجهزة أندرويد مع حالة اتصال لحظية." },
    { icon: Activity, title: "متابعة لحظية", desc: "تدفق مباشر للحوالات الجديدة، مع تنبيهات ذكية وسجل تدقيق كامل." },
    { icon: Plug, title: "ربط سهل", desc: "WooCommerce، REST API، وWebhooks موقّعة بسر مشترك." },
    { icon: BarChart3, title: "تحليلات تشغيلية", desc: "لوحات تحكم للتجار والمشغلين برؤى يومية وشهرية." },
  ];
  return (
    <section id="features" className="py-24 border-t">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow="المميزات" title="بنية تشغيلية لمعالجة المدفوعات بكفاءة" />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {items.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card-gradient p-6 shadow-soft hover:shadow-elegant transition">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
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

function HowItWorks() {
  const steps = [
    { n: "01", t: "وصّل جهاز التحصيل", d: "حمّل تطبيق جوهر باي على جهاز أندرويد متصل برقم المحفظة الخاص بعملك." },
    { n: "02", t: "اربط حساب التاجر", d: "أضف خطوطك (محافظ / إنستا باي / SMS بنكي) واضبط قواعد المطابقة." },
    { n: "03", t: "ابدأ التأكيد التلقائي", d: "كل رسالة تصل تُحلّل وتُطابق فورًا، ويُحدَّث طلبك عبر API أو Webhook." },
  ];
  return (
    <section id="how" className="py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow="آلية العمل" title="3 خطوات لتفعيل التأكيد التلقائي" />
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-6">
              <div className="text-3xl font-display font-bold text-primary/40">{s.n}</div>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = ["متاجر WooCommerce", "متاجر الخدمات الرقمية", "شحن الألعاب", "الاشتراكات الشهرية", "المنتجات الرقمية", "المواقع المخصصة"];
  return (
    <section className="py-24 border-t">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow="استخدامات" title="مصمم لتجار التجزئة الرقمية في مصر" />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
          {cases.map((c) => (
            <div key={c} className="rounded-lg border bg-card px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-success" />
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
    { name: "المبتدئ", price: "299", line: "خط واحد", features: ["تأكيد فوري", "API + Webhooks", "دعم بالبريد"] },
    { name: "النمو", price: "799", popular: true, line: "حتى 3 خطوط", features: ["كل مزايا المبتدئ", "WooCommerce", "محرك تحليل ذكي", "دعم ذو أولوية"] },
    { name: "المؤسسة", price: "2,499", line: "حتى 20 خطًا", features: ["كل مزايا النمو", "SSO + SAML", "اتفاقية مستوى خدمة", "مدير حساب مخصّص"] },
  ];
  return (
    <section id="pricing" className="py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow="الباقات" title="اختر الباقة المناسبة لعملك" />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-6 ${p.popular ? "bg-card-gradient border-primary shadow-elegant" : "bg-card"}`}>
              {p.popular && <div className="text-xs text-primary font-medium mb-2">الأكثر شعبية</div>}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">ج.م / شهر</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{p.line}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-6"><Button className="w-full" variant={p.popular ? "default" : "outline"}>ابدأ الآن</Button></Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FutureModule() {
  return (
    <section className="py-20 border-t">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs rounded-full border px-3 py-1 mb-4">
          <Sparkles className="h-3 w-3 text-primary" /> قريباً
        </div>
        <h2 className="font-display text-3xl font-bold">وحدة التحويلات الذكية</h2>
        <p className="mt-3 text-muted-foreground">
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
    ["هل أحتاج إنترنت دائم على الجهاز؟", "نعم، لكن التطبيق مصمم للعمل في ظروف الشبكة الضعيفة مع إعادة محاولة وذاكرة تخزين محلية."],
    ["هل يمكن الربط مع متجري؟", "نعم. لدينا إضافة WooCommerce وREST API وWebhooks موقّعة."],
  ];
  return (
    <section id="faq" className="py-24 border-t bg-muted/20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionTitle eyebrow="الأسئلة الشائعة" title="إجابات على أكثر ما يُسأل" />
        <div className="mt-10 space-y-4">
          {qa.map(([q, a]) => (
            <details key={q} className="group rounded-lg border bg-card p-5">
              <summary className="cursor-pointer font-medium flex items-center justify-between">
                {q}
                <span className="text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} جوهر باي. جميع الحقوق محفوظة.</div>
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
      <div className="text-xs text-primary font-medium tracking-widest uppercase">{eyebrow}</div>
      <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold text-balance">{title}</h2>
    </div>
  );
}
