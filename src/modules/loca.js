const db = await FileAttachment("./data/skills.parquet").json()

function normalizeLocale() {
    const locale = navigator.language?.toLowerCase();
    view(locale)
    if (locale.startsWith('de')) return 'de';
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('fr')) return 'fr';
    if (locale.startsWith('ja')) return 'ja';
    if (locale.startsWith('ko')) return 'ko';
    if (locale.startsWith('pt')) return 'pt';

    if (locale === 'zh-tw' || locale === 'zh-hk' || locale === 'zh-mo')
        return 'zh-Hant';

    // All Spanish LATAM
    if (locale.startsWith('es-')) return 'es-419';

    return 'en'; // fallback
}