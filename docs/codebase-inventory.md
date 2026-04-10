# Kod tabanı envanteri (sıcak noktalar ve Tauri yüzeyi)

Bu belge, modülerleştirme planı kapsamında **satır sayısı sıralaması**, **Tauri `invoke` komut haritası** ve **katmanlı import yönü** için referans sağlar. Güncelleme: API çağrıları `src/services/api` altında toplandı; usecase akışı `src/services/usecases/generationFlow/` altında ayrıldı.

## En büyük TypeScript / TSX dosyaları (yaklaşık LOC)

`translations.ts` ve benzeri saf veri dosyaları hariç, uygulama mantığı açısından dikkat çekenler:

| Satır (yaklaşık) | Dosya | Not |
|------------------|--------|-----|
| ~290 | `src/services/pdfExportService.ts` + `pdfExport/*` | jsPDF düzeni; palet/çizim/font/metin ayrı modüllerde |
| ~320 | `src/components/quiz-config/PdfExtractionCollapsible.tsx` + `pdf-extraction/*` | PDF / hybrid UI (metin, hook, toggle ayrıldı) |
| 267 | `src/services/gemini/quizPrompts.ts` | Prompt metinleri |
| 265 | `src/store/useGenerationStore.ts` | Üretim state |
| 262 | `src/services/usecases/generationFlow/*` | Quiz / flashcard orchestration (modüllere bölündü) |
| 221 | `src/services/pdfService.ts` | PDF çıkarma ve normalizasyon |
| 215 | `src/services/appFlows.ts` | Dosya yükleme ve yönlendirme akışları |

## Tauri `invoke` komutları → `src/services/api`

| Komut | API modülü | Tüketiciler |
|-------|------------|-------------|
| `pdf_runtime_status` | `pdfRuntime.ts` | `usePdfRuntimeStore` |
| `pdf_bootstrap_runtime` | `pdfRuntime.ts` | `usePdfRuntimeStore` |
| `pdf_hybrid_start` | `pdfRuntime.ts` | `usePdfRuntimeStore` |
| `pdf_hybrid_stop` | `pdfRuntime.ts` | `usePdfRuntimeStore` |
| `extract_pdf_document` | `pdfExtract.ts` | `pdfService` |
| `extract_pdf_document_payload` | `pdfExtract.ts` | `pdfService` |
| `read_pdf_file_info` | `pdfFiles.ts` | `appFlows` |
| `save_quiz_pdf` | `quizPdf.ts` | `pdfExportService` |
| `gemini_cli_status` | `geminiBackend.ts` | `useCliStatusStore` |
| `gemini_cli_setup_action` | `geminiBackend.ts` | `useGeminiCliPanel` |
| `gemini_run` | `geminiBackend.ts` | `services/gemini/cli` |
| `abort_gemini_run` | `geminiBackend.ts` | `services/gemini/cli` |

**Tauri dışı:** `listen`, `getCurrentWindow`, `open` (dialog) çağrıları ilgili store/hook’ta kalır; yalnızca `invoke` tek yüzeyde toplandı.

## Import grafiği (hedef yön)

```text
views / components
    → hooks, store
    → services/usecases
    → services (gemini, pdfService, appFlows, …)
    → services/api   (yalnızca Tauri komutları)
    → utils, constants, types
```

- **Döngüden kaçınma:** `services/api` alt modülleri `store` veya `components` import etmemeli.
- **Barrel:** İsteğe bağlı olarak `services/api/index.ts` dışa açık fonksiyonları toplar; iç modüller birbirini doğrudan import edebilir.

## Sonraki adaylar (isteğe bağlı)

- İsteğe bağlı: `exportQuizToPDF` gövdesini soru kartı / üst bilgi gibi alt fonksiyonlara bölmek.

### Yapılan ek parçalama

- `src/components/quiz-config/pdf-extraction/pdfExtractionCopy.ts` — çift dilli metinler
- `pdf-extraction/usePdfExtractionSection.ts` — runtime store + OCR UI state + `updateExtraction` / `updateHybridServer`
- `pdf-extraction/PdfExtractionToggle.tsx` — ortak toggle satırı

- `src/services/pdfExport/draw.ts` — `PDF_EXPORT_THEME`, `lineHeightPt`, `STRIPE_PT`, RGB setter’lar, `strokeCard`
- `pdfExport/sanitizeText.ts` — `sanitizeTextForPdf`
- `pdfExport/font.ts` — Noto Sans gömme (`embedNotoSans`)
- `pdfExport/runtime.ts` — `isTauriApp`, `arrayBufferToBase64Chunked`
