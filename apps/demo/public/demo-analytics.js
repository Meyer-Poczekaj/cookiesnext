// Beispiel-"Tracking"-Script für die Demo. Es tut nichts Böses — es zeigt
// nur sichtbar an, dass es ausgeführt wurde.
console.log('[demo-analytics] Script wurde geladen und ausgeführt.')
window.__demoAnalyticsLoaded = true
document.cookie = '_demo=1; path=/; max-age=31536000; SameSite=Lax'
