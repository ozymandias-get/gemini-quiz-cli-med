import { Difficulty, QuestionStyle, ModelType, LanguageCode } from '../types';

/** Ayarlar ekranı ve çeviri haritası için yalnızca bu diller desteklenir. */
export const SUPPORTED_LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const TR_CONTENT = {
    appTitle: "QuizLab",
    closeConfirmTitle: "QuizLab",
    closeConfirmMessage:
      "Sınavınız/işleminiz devam ediyor. Çıkmak istediğinize emin misiniz?",
    questionLabel: "Soru",
    landing: {
      badge: "Yapay Zeka Destekli Öğrenme Asistanı",
      titleStart: "Ders Notlarını",
      titleHighlight: "Canlı Bir Sınava Dönüştür", // Birleştirildi
      titleEnd: "", // Boş bırakıldı, yukarıya dahil edildi
      subtitle: "Yüzlerce sayfalık PDF'leri okumakla vakit kaybetme. QuizLab, ders materyallerini saniyeler içinde analiz eder, en kritik noktaları bulur ve seni akademik seviyede test eder.",
      cta: "Hemen Başla",
      demoCta: "Demo sınav",
      resumeQuizCta: "Yarım kalan sınavınıza devam edin",
      whyTitle: "YENİ NESİL ÖĞRENME TEKNOLOJİSİ",
      cards: [
        {
          title: "Derinlemesine Analiz",
          desc: "Gemini 3.1 motorumuz, metnin anlamsal bağlamını kavrar ve 'bunu hoca sorsa nasıl sorardı?' mantığıyla soru üretir."
        },
        {
          title: "Aktif Hatırlama",
          desc: "Sadece okuyarak değil, kendinizi zorlayarak ve yanlış yaparak kalıcı öğrenin."
        },
        {
          title: "Kişisel Özel Ders",
          desc: "Her soru için detaylı çözüm analizleri ve 'Neden yanlış yaptım?' açıklamaları."
        }
      ],
      bento: {
        focusTitle: "Nokta Atışı Odaklanma",
        focusDesc: "Tüm PDF'i değil, sadece 'Mitoz Bölünme' veya 'Kurtuluş Savaşı' gibi spesifik konuları çalışmak isteyebilirsiniz. Konuyu yazın, yapay zeka oraya odaklansın.",
        styleTitle: "Soru Tarzı Klonlama",
        styleDesc: "Hocanızın veya ÖSYM'nin soru tarzını beğendiniz mi? Bir örnek yükleyin, yapay zeka o üslubu taklit ederek yeni sorular üretsin.",
        flashTitle: "Akıllı Kartlar (Flashcards)",
        flashDesc: "Sınav modundan sıkıldınız mı? Metindeki önemli terimleri otomatik olarak çalışma kartlarına dönüştürün ve ezber yapın."
      },
      geminiCli: {
        title: "Gemini CLI",
        installed: "Kurulu",
        notInstalled: "Kurulu değil",
        versionLabel: "Sürüm",
        devBadge: "Geliştirme",
        devOnlyButton: "Kurulum talimatlarını göster (CMD)",
        installButton: "Gemini CLI kur",
        desktopOnly: "Bu bölüm yalnızca masaüstü uygulamasında kullanılabilir.",
        loading: "Kontrol ediliyor…",
        refresh: "Yenile",
      },
    },
    features: {
      upload: "Sürükle ve Bırak",
      uploadDesc: "Karmaşık notlar veya uzun makaleler. PDF'inizi sisteme bırakın, gerisini bize bırakın.",
      analyze: "Derinlemesine Analiz",
      analyzeDesc: "Gemini motoru metninizi satır satır tarar, ana fikri anlar ve en kritik noktalardan sorular çıkarır.",
      quiz: "Kendini Test Et",
      quizDesc: "Sadece ezber yapma, öğren. Akademik standartlarda hazırlanan sorularla bilgini kalıcı hale getir."
    },
    settings: "Ayarlar",
    selectLanguage: "Dil Seçimi",
    darkMode: "Karanlık Mod",
    settingsCliMissing:
      "Gemini CLI kurulu görünmüyor veya PATH eksik. Soruları üretmek için CLI gerekir.",
    recheckCli: "Tekrar Kontrol Et",
    close: "Kapat",
    uploadTitle: "PDF Dosyanı Yükle",
    uploadDesc: "Ders notlarını veya kitapları yükle. Gemini senin için zorlu sorular hazırlasın.",
    uploadLimitsHint: "Maks. 20 MB ve 500 Sayfa",
    clickToSelect: "Dosya seçmek için tıkla",
    or: "veya",
    demoQuizTitle: "Demo sınavı",
    analyzing: "Metin okunuyor...",
    fileSelected: "Dosya Hazır",
    changeFile: "Dosyayı Değiştir",
    resetPdf: "Sıfırla",
    settingsTitle: "Sınav Ayarları",
    difficulty: "Zorluk Seviyesi",
    modelLabel: "Zeka Modeli",
    proModel: "Gemini 3.1 Pro",
    proDesc: "Derin Düşünme (Yavaş)",
    flashModel: "Gemini 3 Flash",
    flashDesc: "Önerilen (Dengeli)",
    flash25Model: "Gemini 2.5 Flash",
    flash25Desc: "Kararlı & Hızlı (API)",
    liteModel: "Gemini 3.1 Flash-Lite",
    liteDesc: "En Hızlı & Ekonomik (Önizleme)",
    style: "Soru Tarzı",
    qCount: "Soru Sayısı:",
    advanced: "Gelişmiş & Odaklanma",
    focusTopic: "Yapay Zeka Odak Konusu",
    focusPlaceholder: "Örn: 'Mitoz Bölünme', 'Kurtuluş Savaşı', 'Newton Kanunları'...",
    focusDesc: "Belirli bir konuyu girerseniz, Gemini soruları o konu ve ilişkili kavramlar etrafında yoğunlaştırır.",
    exampleContent: "Örnek Soru Stili",
    examplePlaceholder: "Örnek bir soru metni yapıştırın...",
    exampleDesc: "Yapay zeka bu stile benzer sorular üretecektir.",
    uploadImage: "Görsel Ekle",
    imageAdded: "Görsel Eklendi",
    createQuiz: "Sınavı Başlat",
    createFlashcards: "Kartlarla Çalış",
    creating: "Gemini metni derinlemesine analiz ediyor ve pedagojik açıklamalar hazırlıyor...",
    batchCreating: "✨ Soru Seti Hazırlanıyor ({current} / {total}). Lütfen bekleyin...",
    creatingFlashcards: "Önemli kavramlar çıkarılıyor ve hafıza kartları hazırlanıyor...",
    remedialCreating: "Hatalı olduğun konular analiz ediliyor ve pekiştirme soruları hazırlanıyor...",
    question: "Soru",
    detailedSolution: "Kapsamlı Çözüm Analizi",
    showSource: "Kaynağı Göster",
    copyQuestion: "Kopyala",
    copyQuestionAria: "Soru kökü ve şıkları panoya kopyala",
    copyQuestionDone: "Kopyalandı",
    showExplanation: "Yapay Zekaya Sor",
    hideExplanation: "Kapat",
    successTitle: "Harika İş Çıkardın!",
    successSubtitle: "Konuya oldukça hakimsin, tebrikler!",
    failTitle: "Gelişebilirsin",
    failSubtitle: "Eksiklerini tamamlamak için aşağıdaki detaylı analizleri incele.",
    score: "Puan",
    correct: "Doğru",
    total: "Toplam",
    time: "Süre",
    newSettings: "Yeni Sınav",
    regenerateBtn: "Farklı Sorularla Tekrarla",
    regenerateActive: "Farklı Sorularla Tekrarla Modu Aktif",
    regenerateActiveDesc: "Yapay zeka önceki soruları hafızasında tutuyor. Aynı soruları sormamak için metnin farklı noktalarına odaklanacak.",
    newPdf: "Yeni PDF",
    backToStart: "Ana Sayfa",
    downloadPdf: "Sonuçları İndir",
    downloadPreparing: "Hazırlanıyor…",
    pdfExport: {
      documentTitle: "QuizLab - Sınav Sonuçları",
      fileLabel: "Dosya",
      scoreLabel: "Puan",
      scoreDash: "—",
      solutionPrefix: "Çözüm ve Açıklama:",
      analysisHeading: "Kapsamlı Çözüm Analizi",
      footerBrand: "QuizLab AI",
      pageWord: "Sayfa",
      resultFileSuffix: "Sonuc",
      savedToLocation: "PDF seçilen konuma kaydedildi.",
      browserDownload: "PDF indirmesi başlatıldı. Dosya adı: {name}",
      saveCancelled: "Kayıt penceresi iptal edildi; dosya kaydedilmedi.",
      saveError: "PDF kaydedilirken bir hata oluştu.",
    },
    remedialBtn: "Eksikleri Tamamla",
    footer: "Powered by Gemini 3.1 Pro & 3 Flash",
    prevBtn: "Önceki",
    nextBtn: "Sonraki",
    finishBtn: "Sınavı Bitir",
    clearSelection: "Seçimi Temizle",
    blankAnswer: "Boş Bırakıldı",
    uploadRequired: "Lütfen önce bir PDF dosyası yükleyin.",
    askAi: "Yapay Zekaya Sor",
    chatPlaceholder: "Bu soruyla ilgili bir şey sor...",
    navTitle: "Soru Haritası",
    filterAll: "Tümü",
    filterWrong: "Yanlışlar",
    filterBlank: "Boşlar",
    filterNoResults: "Bu filtreye uygun soru yok.",
    aiDisclaimer: "Yapay zeka hata yapabilir. Lütfen cevapları kontrol ediniz.",
    sourceViewer: {
      fileNotFound: "Dosya bulunamadı.",
      loadError: "PDF yüklenirken bir hata oluştu.",
      searchPlaceholder: "PDF içinde ara...",
      page: "Sayfa",
      loadingPdf: "PDF yükleniyor...",
      questionContext: "Soru bağlamı",
      correctEvidence: "Doğru cevap kanıtı",
      sourceText: "Kaynak metin",
      searchOptions: "Seçenekleri ara",
      notInSource: "Kaynakta bulunamadı",
      hidePanel: "Paneli gizle",
    },
    studyMode: {
      title: "Çalışma Kartları",
      flipInstruction: "Çevirmek için karta tıkla",
      progress: "İlerleme",
      backToConfig: "Ayarlara Dön",
      empty: "Henüz kart yok. Ayarlardan tekrar oluşturun.",
      frontSideLabel: "Soru / Terim",
      backSideLabel: "Cevap / Tanım",
    },
    ready: {
      title: "Sınav Hazır!",
      subtitle: "Yapay zeka analizini tamamladı ve soruları hazırladı.",
      startBtn: "Sınavı Başlat",
      questionCount: "Soru",
      estimatedTime: "Tahmini Süre",
      difficulty: "Zorluk",
      minutes: "dk"
    },
    generation: {
        step1: "PDF Taranıyor...",
        step2: "Kavramlar Analiz Ediliyor...",
        step3: "Sorular Kurgulanıyor...",
        step4: "Son Kontroller...",
        processing: "İşleniyor",
        cancel: "İptal",
    },
    errors: {
      format: "Sadece .pdf yükleyin.",
      textLength: "Metin okunamadı (Taranmış PDF olabilir).",
      generic: "Hata oluştu.",
      generationCancelled: "Oluşturma iptal edildi.",
      chatUnavailable: "Üzgünüm, şu an bağlantıda bir sorun var.",
      noQuestions: "Soru oluşturulamadı.",
      imageError: "Görsel hatası.",
      fileSizePdf:
        "Dosya çok büyük. Lütfen maksimum 20 MB boyutunda bir PDF yükleyin.",
      fileSizeImg: `Max 5MB.`
    },
    toasts: {
      generationCancelled: "Oluşturma iptal edildi.",
      offlineNoConnection:
        "İnternet bağlantısı bulunamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
      flashcardsReady: "Hafıza kartları hazır.",
      questionsPartialAfterValidation:
        "Yapay zeka bazı soruları okunamadığı için eledi. {actual} soru ile sınava başlıyorsunuz. (İstenen: {requested})",
    },
    styles: {
      [QuestionStyle.CLASSIC]: 'Hiyerarşik (En/İlk)',
      [QuestionStyle.NEGATIVE]: 'Negatif Eleme',
      [QuestionStyle.STATEMENT]: 'Öncüllü (I-II-III)',
      [QuestionStyle.ORDERING]: 'Algoritma Sıralama',
      [QuestionStyle.FILL_BLANK]: 'Kilit Kavram',
      [QuestionStyle.REASONING]: 'Klinik Vinyet (Vaka)',
      [QuestionStyle.MATCHING]: 'Klinik Eşleştirme',
      [QuestionStyle.MIXED]: 'Karma (Dengeli)'
    },
    diffs: {
      [Difficulty.EASY]: 'Kolay',
      [Difficulty.MEDIUM]: 'Orta',
      [Difficulty.HARD]: 'Zor'
    }
};

const EN_CONTENT = {
    appTitle: "QuizLab",
    closeConfirmTitle: "QuizLab",
    closeConfirmMessage:
      "Your quiz or operation is still in progress. Are you sure you want to quit?",
    questionLabel: "Question",
    landing: {
      badge: "AI Powered Learning Assistant",
      titleStart: "Turn Lecture Notes",
      titleHighlight: "Into a Live Quiz Instantly",
      titleEnd: "",
      subtitle: "Stop wasting time just reading PDFs. QuizLab analyzes your materials, finds critical concepts, and tests you at an academic level.",
      cta: "Get Started",
      demoCta: "Demo quiz",
      resumeQuizCta: "Resume your unfinished quiz",
      whyTitle: "NEXT GEN LEARNING TECH",
      cards: [
        {
          title: "Game-Changing Analysis",
          desc: "Not simple keyword matching. Our Gemini 3.1 engine understands semantic context and generates questions like a real professor."
        },
        {
          title: "Active Recall",
          desc: "The most scientifically effective way to learn. Don't just read; challenge yourself and learn from mistakes for retention."
        },
        {
          title: "Personal Tutor",
          desc: "An AI tutor that provides detailed solution analysis and 'Why did I get this wrong?' explanations for every question."
        }
      ],
      bento: {
        focusTitle: "Laser Focus Mode",
        focusDesc: "Don't want the whole PDF? Type a topic like 'Mitosis' or 'WWII', and AI will generate questions specifically for that area.",
        styleTitle: "Style Cloning",
        styleDesc: "Like a specific question style? Upload an example, and the AI will mimic that tone and structure for your new questions.",
        flashTitle: "Smart Flashcards",
        flashDesc: "Tired of quizzes? Automatically convert key terms from your text into flashcards for quick memorization."
      },
      geminiCli: {
        title: "Gemini CLI",
        installed: "Installed",
        notInstalled: "Not installed",
        versionLabel: "Version",
        devBadge: "Development",
        devOnlyButton: "Show install instructions (CMD)",
        installButton: "Install Gemini CLI",
        desktopOnly: "This section is only available in the desktop app.",
        loading: "Checking…",
        refresh: "Refresh",
      },
    },
    features: {
      upload: "Drag & Drop",
      uploadDesc: "Complex notes or long articles. Drop your PDF, leave the rest to us.",
      analyze: "Deep Analysis",
      analyzeDesc: "Gemini engine scans text line by line, understands concepts, and extracts critical questions.",
      quiz: "Test Yourself",
      quizDesc: "Don't just memorize, learn. Solidify knowledge with academic standard questions."
    },
    settings: "Settings",
    selectLanguage: "Language",
    darkMode: "Dark Mode",
    settingsCliMissing:
      "Gemini CLI does not appear to be installed or PATH may be incomplete. The CLI is required to generate content.",
    recheckCli: "Check again",
    close: "Close",
    uploadTitle: "Upload PDF",
    uploadDesc: "Upload notes or books. Let Gemini generate challenging questions.",
    uploadLimitsHint: "Max 20 MB and 500 pages",
    clickToSelect: "Click to select",
    or: "or",
    demoQuizTitle: "Demo quiz",
    analyzing: "Reading text...",
    fileSelected: "File Ready",
    changeFile: "Change File",
    resetPdf: "Reset",
    settingsTitle: "Quiz Settings",
    difficulty: "Difficulty",
    modelLabel: "AI Model",
    proModel: "Gemini 3.1 Pro",
    proDesc: "Deep Reasoning (Slow)",
    flashModel: "Gemini 3 Flash",
    flashDesc: "Recommended (Balanced)",
    flash25Model: "Gemini 2.5 Flash",
    flash25Desc: "Stable & fast",
    liteModel: "Gemini 3.1 Flash-Lite",
    liteDesc: "Fastest & economical (preview)",
    style: "Question Style",
    qCount: "Questions:",
    advanced: "Advanced & Focus",
    focusTopic: "AI Focus Topic",
    focusPlaceholder: "Ex: 'Mitosis', 'WWII', 'Newton Laws'...",
    focusDesc: "If you enter a topic, Gemini will prioritize generating questions around it.",
    exampleContent: "Example Style",
    examplePlaceholder: "Paste sample text...",
    exampleDesc: "AI will mimic this style.",
    uploadImage: "Add Image",
    imageAdded: "Image Added",
    createQuiz: "Start Quiz",
    createFlashcards: "Study Flashcards",
    creating: "Gemini is performing deep analysis and preparing pedagogical feedback...",
    batchCreating: "✨ Assembling Question Bundle ({current} / {total}). Please wait...",
    creatingFlashcards: "Extracting key concepts and preparing memory cards...",
    remedialCreating: "Analyzing weak areas and generating remedial questions...",
    question: "Question",
    detailedSolution: "Comprehensive solution analysis",
    showSource: "Show source",
    copyQuestion: "Copy",
    copyQuestionAria: "Copy question stem and options to clipboard",
    copyQuestionDone: "Copied",
    showExplanation: "Ask AI",
    hideExplanation: "Close",
    successTitle: "Great Job!",
    successSubtitle: "Excellent grasp of the subject!",
    failTitle: "Keep Learning",
    failSubtitle: "Review the detailed feedback below to improve.",
    score: "Score",
    correct: "Correct",
    total: "Total",
    time: "Time",
    newSettings: "New Quiz",
    regenerateBtn: "Regenerate Different Questions",
    regenerateActive: "Regeneration Mode Active",
    regenerateActiveDesc: "AI remembers previous questions. It will focus on different parts of the text to avoid repetition.",
    newPdf: "New PDF",
    backToStart: "Home",
    downloadPdf: "Download PDF",
    downloadPreparing: "Preparing…",
    pdfExport: {
      documentTitle: "QuizLab - Quiz Results",
      fileLabel: "File",
      scoreLabel: "Score",
      scoreDash: "—",
      solutionPrefix: "Solution and explanation:",
      analysisHeading: "Comprehensive solution analysis",
      footerBrand: "QuizLab AI",
      pageWord: "Page",
      resultFileSuffix: "Result",
      savedToLocation: "PDF saved to the location you selected.",
      browserDownload: "Download started. File name: {name}",
      saveCancelled: "Save dialog was cancelled; file was not saved.",
      saveError: "Could not save the PDF.",
    },
    remedialBtn: "Reinforce Weak Areas",
    footer: "Powered by Gemini 3.1 Pro & 3 Flash",
    prevBtn: "Previous",
    nextBtn: "Next",
    finishBtn: "Finish Quiz",
    clearSelection: "Clear Selection",
    blankAnswer: "Left Blank",
    uploadRequired: "Please upload a PDF file first.",
    askAi: "Ask AI",
    chatPlaceholder: "Ask something about this question...",
    navTitle: "Question Navigator",
    filterAll: "All",
    filterWrong: "Incorrect",
    filterBlank: "Unanswered",
    filterNoResults: "No questions match this filter.",
    aiDisclaimer: "Artificial intelligence can make mistakes. Please check the answers.",
    sourceViewer: {
      fileNotFound: "File not found.",
      loadError: "Could not load the PDF.",
      searchPlaceholder: "Search in PDF…",
      page: "Page",
      loadingPdf: "Loading PDF…",
      questionContext: "Question context",
      correctEvidence: "Evidence for correct answer",
      sourceText: "Source text",
      searchOptions: "Find options in PDF",
      notInSource: "Not found in source",
      hidePanel: "Hide panel",
    },
    studyMode: {
      title: "Study Flashcards",
      flipInstruction: "Click card to flip",
      progress: "Progress",
      backToConfig: "Back to Settings",
      empty: "No flashcards yet. Generate again from settings.",
      frontSideLabel: "Question / Term",
      backSideLabel: "Answer / Definition",
    },
    ready: {
      title: "Quiz Ready!",
      subtitle: "AI has finished analysis and prepared your questions.",
      startBtn: "Start Quiz",
      questionCount: "Questions",
      estimatedTime: "Est. Time",
      difficulty: "Difficulty",
      minutes: "min"
    },
    generation: {
        step1: "Scanning PDF...",
        step2: "Analyzing Concepts...",
        step3: "Crafting Questions...",
        step4: "Finalizing...",
        processing: "Processing",
        cancel: "Cancel",
    },
    errors: {
      format: "Upload .pdf only.",
      textLength: "Could not read text.",
      generic: "Error occurred.",
      generationCancelled: "Generation was cancelled.",
      chatUnavailable: "Sorry, there's a connection issue right now.",
      noQuestions: "Generation failed.",
      imageError: "Image error.",
      fileSizePdf:
        "File is too large. Please upload a PDF of at most 20 MB.",
      fileSizeImg: `Max 5MB.`
    },
    toasts: {
      generationCancelled: "Generation was cancelled.",
      offlineNoConnection:
        "No internet connection. Please check your connection and try again.",
      flashcardsReady: "Flashcards are ready.",
      questionsPartialAfterValidation:
        "Some questions could not be read and were dropped. Starting the quiz with {actual} question(s). (Requested: {requested})",
    },
    styles: {
      [QuestionStyle.CLASSIC]: 'Hierarchical (Most/First)',
      [QuestionStyle.NEGATIVE]: 'Negative Elimination',
      [QuestionStyle.STATEMENT]: 'Statement (I-II-III)',
      [QuestionStyle.ORDERING]: 'Algorithm Ordering',
      [QuestionStyle.FILL_BLANK]: 'Key Concept',
      [QuestionStyle.REASONING]: 'Clinical Vignette',
      [QuestionStyle.MATCHING]: 'Clinical Matching',
      [QuestionStyle.MIXED]: 'Mixed Simulation'
    },
    diffs: {
      [Difficulty.EASY]: 'Easy',
      [Difficulty.MEDIUM]: 'Medium',
      [Difficulty.HARD]: 'Hard'
    }
};

export type TranslationContent = typeof TR_CONTENT;

export const TRANSLATIONS: Record<LanguageCode, TranslationContent> = {
  tr: TR_CONTENT,
  en: EN_CONTENT,
};

/** Ayarlardaki model seçimi ile aynı kısa etiket (dropdown ile senkron). */
export function getModelDisplayName(model: ModelType, t: TranslationContent): string {
  switch (model) {
    case ModelType.PRO:
      return t.proModel;
    case ModelType.FLASH:
      return t.flashModel;
    case ModelType.FLASH_2_5:
      return t.flash25Model;
    case ModelType.LITE:
      return t.liteModel;
    default:
      return t.flashModel;
  }
}
