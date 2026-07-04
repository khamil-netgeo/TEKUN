#!/usr/bin/env python3
"""Add M10 i18n keys to ms.json and en.json"""

import json

# ─── BM additions ─────────────────────────────────────────────────────────────
MS_M10 = {
    "apiHealth": "Monitor Kesihatan API",
    "integrationConfig": "Konfigurasi Integrasi",
    "retryFallback": "Retry & Fallback",
    "circuitBreaker": "Circuit Breaker",
    "latencyMonitor": "Monitor Latensi",
    "uptimeTracking": "Penjejakan Uptime",
    "alertConfig": "Konfigurasi Amaran",
    "healthLogs": "Log Kesihatan",
    "testService": "Uji Perkhidmatan",
    "resetCircuitBreaker": "Reset Circuit Breaker",
    "serviceStatus": "Status Perkhidmatan",
    "avgLatency": "Latensi Purata",
    "uptime30d": "Uptime 30 Hari",
    "lastChecked": "Semak Terakhir",
    "circuitOpen": "Litar Terbuka",
    "circuitClosed": "Litar Tertutup",
    "circuitHalfOpen": "Litar Separuh Terbuka",
    "degraded": "Prestasi Merosot",
    "latencyThreshold": "Ambang Latensi",
    "downtimeThreshold": "Ambang Downtime",
    "errorRateThreshold": "Ambang Kadar Ralat",
    "notifyEmail": "Notifikasi Email",
    "notifySms": "Notifikasi SMS",
    "alertActive": "Amaran Aktif",
}

# ─── EN additions ─────────────────────────────────────────────────────────────
EN_M10 = {
    "apiHealth": "API Health Monitor",
    "integrationConfig": "Integration Configuration",
    "retryFallback": "Retry & Fallback",
    "circuitBreaker": "Circuit Breaker",
    "latencyMonitor": "Latency Monitor",
    "uptimeTracking": "Uptime Tracking",
    "alertConfig": "Alert Configuration",
    "healthLogs": "Health Logs",
    "testService": "Test Service",
    "resetCircuitBreaker": "Reset Circuit Breaker",
    "serviceStatus": "Service Status",
    "avgLatency": "Average Latency",
    "uptime30d": "30-Day Uptime",
    "lastChecked": "Last Checked",
    "circuitOpen": "Circuit Open",
    "circuitClosed": "Circuit Closed",
    "circuitHalfOpen": "Circuit Half-Open",
    "degraded": "Degraded Performance",
    "latencyThreshold": "Latency Threshold",
    "downtimeThreshold": "Downtime Threshold",
    "errorRateThreshold": "Error Rate Threshold",
    "notifyEmail": "Email Notification",
    "notifySms": "SMS Notification",
    "alertActive": "Alert Active",
}

for path, m10_data in [
    ('/home/ubuntu/sppt/frontend/src/i18n/locales/ms.json', MS_M10),
    ('/home/ubuntu/sppt/frontend/src/i18n/locales/en.json', EN_M10),
]:
    with open(path) as f:
        data = json.load(f)
    
    existing = data.get('module10', {})
    existing.update(m10_data)
    data['module10'] = existing
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    print(f"Updated {path} with {len(m10_data)} module10 keys")

print("Done.")
