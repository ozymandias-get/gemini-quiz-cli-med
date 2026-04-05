

**Diller:** [Türkçe](README.tr.md) · [English](README.md)

# QuizLab Med — PDF’ten yapay zeka ile özelleştirilebilir sınav

**QuizLab Med**, akademik PDF materyallerinden (tıp ve diğer disiplinler) **yapay zeka destekli, özelleştirilebilir sınavlar** üretmek için tasarlanmış **Tauri 2** masaüstü uygulamasıdır. Ders notu veya kitap **PDF** olarak yüklenir; soru ve kart üretimi **Google Gemini CLI** ile yapılır. Uygulama paketine `GEMINI_API_KEY` gömülmez; tarayıcı içi `@google/genai` ile de çağrı yapılmaz — kimlik doğrulama ve anahtar yönetimi **CLI tarafında** kalır.

**Pencere adı:** QuizLab · **Uygulama kimliği:** `com.quizlab.med` · Proje geliştirme aşamasındadır (`0.0.0`).

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Önkoşullar](#önkoşullar)
- [Kurulum](#kurulum)
- [Geliştirme](#geliştirme)
- [Üretim derlemesi](#üretim-derlemesi)
- [Sık sorulan sorular](#sık-sorulan-sorular)
- [Referanslar](#referanslar)

## Özellikler

- **PDF’ten sınav:** Not veya kitap PDF’i yükleyin; metin analizi ve soru üretimi Gemini motoru ile yapılır (yaklaşık **20 MB / 500 sayfa** üst sınırı).
- **Özelleştirme:** Soru sayısı, **zorluk** seviyeleri ve **soru stili**; birden fazla **Gemini** model seçeneği (ör. Pro, Flash, Flash-Lite — arayüzdeki etiketlere göre).
- **Odak konu:** Tüm dosya yerine belirli bir konuya (ör. “Mitoz”, “Kalp yetmezliği”) göre soru üretimi.
- **Stil taklidi:** Örnek soru yükleyerek ton ve yapıyı modele aktarma.
- **Aktif öğrenme:** Çoktan seçmeli sınav, **akıllı kart** modu ve soru başına çözüm / “neden yanlış?” tarzı analizler.
- **Dil:** Arayüz **Türkçe** ve **İngilizce** destekler.
- **Oturum:** Demo sınav ve yarım kalan sınavı sürdürme akışları.
- **Masaüstü:** Windows (ve Tauri yapılandırmasına bağlı diğer hedefler) için yerel uygulama deneyimi.

## Teknoloji


| Katman     | Araçlar                                                                                                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ön uç      | [Vite](https://vitejs.dev/) 6, [React](https://react.dev/) 19, TypeScript, [Tailwind CSS](https://tailwindcss.com/) 4, [Framer Motion](https://www.framer.com/motion/), [Zustand](https://zustand-demo.pmnd.rs/), [pdfjs-dist](https://github.com/mozilla/pdf.js), [Zod](https://zod.dev/) |
| Masaüstü   | [Tauri](https://v2.tauri.app/) 2, Rust                                                                                                                                                                                                                                                     |
| Yapay zeka | [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) (`@google/gemini-cli`)                                                                                                                                                                                                    |


## Önkoşullar

- [Node.js](https://nodejs.org/) (LTS önerilir)
- [Rust](https://rustup.rs/) (Cargo ile birlikte)
- **Gemini CLI** — tercihen global kurulum:
  ```bash
  npm install -g @google/gemini-cli
  gemini --version
  ```
  Uygulama önce `gemini` / `gemini.cmd` yolunu dener; bulunamazsa **`npx -y @google/gemini-cli`** kullanır. Bu nedenle **Node.js** ve **`npx` PATH’te** olmalıdır (masaüstü kısayolundan açılan Tauri’de global `gemini` görünmeyebilir; `npx` yedeği devreye girer). Google hesabı veya API anahtarı ile **CLI tarafında** oturum gerekir ([Gemini CLI belgeleri](https://github.com/google-gemini/gemini-cli)).

İsteğe bağlı: `cargo install tauri-cli` ile `cargo tauri` alt komutlarını kullanabilirsiniz; aksi halde proje `**npx @tauri-apps/cli`** ile çalışır.

## Kurulum

```bash
npm install
```

## Geliştirme

Ön yüzü Vite ile açar ve Tauri penceresini bağlar (tam özellikli masaüstü; AI üretimi için CLI gerekir):

```bash
npm run tauri:dev
```

Yalnızca web ön yüzü (Tauri olmadan). **Yapay zeka çağrıları bu modda çalışmaz:**

```bash
npm run dev
```

## Üretim derlemesi

```bash
npm run tauri:build
```

Çıktılar `src-tauri/target/release/` ve `src-tauri/target/release/bundle/` altında oluşur (örneğin Windows’ta `.msi` ve `.exe` kurulum paketleri).

## Sık sorulan sorular

**Neden uygulama içinde API anahtarı yok?**  
Soru üretimi Gemini CLI üzerinden yapıldığı için anahtar veya oturum bilgisi derleme paketine gömülmez; yapılandırma kullanıcı ortamında ve CLI ile yönetilir.

**Gemini CLI kurulu mu, nasıl anlarım?**  
Terminalde `gemini --version` çalıştırın. Uygulama içinde de (masaüstü sürümünde) CLI durumu için arayüz bölümü bulunabilir.

`**npm run dev` ile neden sınav üretilmiyor?**  
Saf web geliştirme modu Tauri kabuğunu kullanmaz; bu projede AI entegrasyonu masaüstü / CLI akışına bağlıdır. Tam deneyim için `npm run tauri:dev` kullanın.

**Hangi dosya türleri desteklenir?**  
Akış PDF odaklıdır; limitler arayüzdeki ipucu ile uyumludur (ör. boyut ve sayfa üst sınırı).

## Referanslar

- [Gemini CLI (GitHub)](https://github.com/google-gemini/gemini-cli)

