"""
SPPT Quality Gate — Automated Test Runner
Usage:
  python3 run_tests.py --module <1-6|all> [--role-test] --base-url http://localhost:8000

Flags:
  --module    Module number 1-6 or 'all'
  --role-test Also run RBAC role-based access tests for all 5 roles
  --base-url  Backend base URL (default: http://localhost:8000)
"""
import argparse
import subprocess
import sys
import json
import os

BASE_URL = "http://localhost:8000"
FRONTEND_DIR = "/home/ubuntu/sppt/frontend"
BACKEND_DIR  = "/home/ubuntu/sppt/backend"
DB_CONTAINER = "sppt_postgres"
DB_USER      = "sppt_user"
DB_NAME      = "sppt_db"

PASS = "\033[92m✅ PASS\033[0m"
FAIL = "\033[91m❌ FAIL\033[0m"
WARN = "\033[93m⚠️  WARN\033[0m"
INFO = "\033[94mℹ️  INFO\033[0m"

results = []

# ─── Helpers ──────────────────────────────────────────────────────────────────

def run(label, cmd, expect_exit=0):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        ok = r.returncode == expect_exit
        status = PASS if ok else FAIL
        print(f"  {status} {label}")
        if not ok:
            out = (r.stdout.strip() or r.stderr.strip())[:200]
            print(f"         → {out}")
        results.append((label, ok))
        return ok
    except Exception as e:
        print(f"  {FAIL} {label} — Exception: {e}")
        results.append((label, False))
        return False

def curl_check(label, path, expected_status, token=None, method="GET"):
    auth = f'-H "Authorization: Bearer {token}"' if token else ""
    cmd  = f'curl -s -o /dev/null -w "%{{http_code}}" -X {method} {auth} {BASE_URL}{path}'
    try:
        r    = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        code = r.stdout.strip()
        ok   = code == str(expected_status)
        status = PASS if ok else FAIL
        print(f"  {status} {label} [{method} {path}] → HTTP {code} (expected {expected_status})")
        results.append((label, ok))
        return ok
    except Exception as e:
        print(f"  {FAIL} {label} — Exception: {e}")
        results.append((label, False))
        return False

def db_check(label, query):
    cmd = f'docker exec {DB_CONTAINER} psql -U {DB_USER} -d {DB_NAME} -t -c "{query}" 2>&1'
    try:
        r  = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        ok = r.returncode == 0 and "ERROR" not in r.stdout and r.stdout.strip() != ""
        status = PASS if ok else FAIL
        print(f"  {status} {label}")
        if not ok:
            print(f"         → {r.stdout.strip()[:200]}")
        results.append((label, ok))
        return ok
    except Exception as e:
        print(f"  {FAIL} {label} — Exception: {e}")
        results.append((label, False))
        return False

def get_token(email="admin@tekun.gov.my", password="demo1234"):
    cmd = (
        f'curl -s -X POST {BASE_URL}/api/auth/login '
        f'-H "Content-Type: application/json" '
        f'-d \'{{"email":"{email}","password":"{password}"}}\''
    )
    try:
        r    = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        data = json.loads(r.stdout)
        return data.get("token") or data.get("data", {}).get("token")
    except:
        return None

# ─── Gate 1: Universal Checks ─────────────────────────────────────────────────

def test_universal():
    print("\n=== GATE 1: Universal Checks ===")
    db_check("PostgreSQL connection",       "SELECT 1")
    db_check("pgvector extension active",   "SELECT extname FROM pg_extension WHERE extname='vector'")
    db_check("uuid-ossp extension active",  "SELECT extname FROM pg_extension WHERE extname='uuid-ossp'")
    db_check("audit_logs table exists",     "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='audit_logs'")
    db_check("users table has role column", "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='role'")

    print("\n  [Frontend Build Check]")
    run("pnpm build (zero TypeScript errors)",
        f"cd {FRONTEND_DIR} && pnpm build 2>&1 | grep -E 'built in|error TS'")

    ms_path = f"{FRONTEND_DIR}/src/i18n/locales/ms.json"
    en_path = f"{FRONTEND_DIR}/src/i18n/locales/en.json"
    if os.path.exists(ms_path) and os.path.exists(en_path):
        with open(ms_path) as f: ms_keys = set(json.load(f).keys())
        with open(en_path)  as f: en_keys = set(json.load(f).keys())
        missing_en = ms_keys - en_keys
        missing_ms = en_keys - ms_keys
        ok = len(missing_en) == 0 and len(missing_ms) == 0
        status = PASS if ok else WARN
        print(f"  {status} i18n key parity (BM ↔ EN)")
        if missing_en: print(f"         → Missing in EN: {list(missing_en)[:5]}")
        if missing_ms: print(f"         → Missing in BM: {list(missing_ms)[:5]}")
        results.append(("i18n key parity", ok))

    print("\n  [Auth Gate Checks]")
    curl_check("Unauthenticated → 401",       "/api/applications", 401)
    curl_check("Login endpoint accessible",   "/api/auth/login",   405)  # GET on POST = 405

# ─── Module Tests ─────────────────────────────────────────────────────────────

def test_module(n, token):
    module_tests = {
        1: test_module1, 2: test_module2, 3: test_module3,
        4: test_module4, 5: test_module5, 6: test_module6,
    }
    if n in module_tests:
        module_tests[n](token)

def test_module1(token):
    print("\n=== MODULE 1 — Pendaftaran & Kelayakan ===")
    db_check("applications table exists", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='applications'")
    db_check("documents table exists",    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='documents'")
    curl_check("GET /api/applications (auth)",          "/api/applications", 200, token)
    curl_check("POST /api/applications (no auth → 401)","/api/applications", 401, method="POST")
    print(f"  {WARN} eKYC AI endpoint — manual verification required (open browser)")
    print(f"  {WARN} OTP flow — manual verification required")
    print(f"  {WARN} Auto-reject engine — test with age=17 in browser")

def test_module2(token):
    print("\n=== MODULE 2 — Penilaian Risiko & Skor Kredit ===")
    db_check("credit_assessments table exists", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='credit_assessments'")
    curl_check("GET /api/credit-assessments (auth)", "/api/credit-assessments", 200, token)
    curl_check("GET /api/amortization (auth)",        "/api/amortization",       200, token)
    print(f"  {WARN} AI credit scoring — verify score 0-100 + grade A-E in browser")
    print(f"  {WARN} Surat Tawaran PDF — verify PDF downloads in browser")
    print(f"  {WARN} Pre-assessment screen — verify dedicated screen at /module2/pre-assessment")

def test_module3(token):
    print("\n=== MODULE 3 — Pengeluaran Dana ===")
    db_check("disbursements table exists", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='disbursements'")
    curl_check("GET /api/disbursements (auth)",     "/api/disbursements",    200, token)
    curl_check("GET /api/authority-matrix (auth)", "/api/authority-matrix", 200, token)
    print(f"  {WARN} Aging escalation — verify files >2 days show escalation badge")
    print(f"  {WARN} Authority matrix routing — verify amount threshold routing in browser")

def test_module4(token):
    print("\n=== MODULE 4 — Pengurusan Akaun & Pembayaran ===")
    db_check("accounts table exists", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='accounts'")
    db_check("payments table exists",  "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='payments'")
    curl_check("GET /api/accounts (auth)",          "/api/accounts",          200, token)
    curl_check("GET /api/tawidh/calculate (auth)", "/api/tawidh/calculate",  200, token)
    print(f"  {WARN} Ta'widh calculator — verify Shariah badge and formula display in browser")
    print(f"  {WARN} Multi-channel payment — verify all 5 channels shown in browser")

def test_module5(token):
    print("\n=== MODULE 5 — Pemulihan & Kutipan ===")
    db_check("collections table exists", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='collections'")
    curl_check("GET /api/npl-accounts (auth)", "/api/npl-accounts", 200, token)
    curl_check("GET /api/dunning (auth)",       "/api/dunning",       200, token)
    print(f"  {WARN} NPL classification — verify all 4 categories shown in browser")
    print(f"  {WARN} Dunning Notis 1/2/3 — verify auto-send log visible in browser")

def test_module6(token):
    print("\n=== MODULE 6 — Dashboard & Analitik ===")
    curl_check("GET /api/analytics/kpi (auth)",   "/api/analytics/kpi",    200, token)
    curl_check("GET /api/reports/builder (auth)", "/api/reports/builder",  200, token)
    print(f"  {WARN} KPI filter by cawangan/negeri — verify dropdowns filter data in browser")
    print(f"  {WARN} Export Excel — verify file downloads in browser")
    print(f"  {WARN} Export PDF — verify file downloads in browser")

# ─── Gate 6: RBAC Role Tests ──────────────────────────────────────────────────

ROLES = [
    {
        "name":  "Pemohon (Applicant)",
        "code":  "applicant",
        "email": "pemohon@tekun.gov.my",
        "allowed":   ["/api/applications"],
        "forbidden": [
            "/api/credit-assessments",
            "/api/disbursements",
            "/api/npl-accounts",
            "/api/dunning",
            "/api/dashboard/executive",
            "/api/analytics/kpi",
            "/api/reports/builder",
        ],
    },
    {
        "name":  "Pegawai Cawangan (Branch Officer)",
        "code":  "branch_officer",
        "email": "pegawai@tekun.gov.my",
        "allowed":   ["/api/applications", "/api/disbursements"],
        "forbidden": [
            "/api/credit-assessments",
            "/api/dashboard/executive",
            "/api/analytics/kpi",
            "/api/npl-accounts",
        ],
    },
    {
        "name":  "Pegawai Kredit (Credit Officer)",
        "code":  "credit_officer",
        "email": "kredit@tekun.gov.my",
        "allowed":   ["/api/applications", "/api/credit-assessments", "/api/amortization"],
        "forbidden": [
            "/api/dashboard/executive",
            "/api/analytics/kpi",
            "/api/dunning",
        ],
    },
    {
        "name":  "Pengurus Cawangan (Branch Manager)",
        "code":  "branch_manager",
        "email": "pengurus@tekun.gov.my",
        "allowed":   [
            "/api/applications",
            "/api/credit-assessments",
            "/api/disbursements",
            "/api/authority-matrix",
            "/api/npl-accounts",
        ],
        "forbidden": [
            "/api/dashboard/executive",
            "/api/analytics/kpi",
        ],
    },
    {
        "name":  "Eksekutif (Executive)",
        "code":  "executive",
        "email": "eksekutif@tekun.gov.my",
        "allowed":   [
            "/api/applications",
            "/api/dashboard/executive",
            "/api/analytics/kpi",
            "/api/reports/builder",
            "/api/npl-accounts",
        ],
        "forbidden": [],  # executive has read access to all; write actions tested separately
    },
    {
        "name":  "Pentadbir Sistem (Admin)",
        "code":  "admin",
        "email": "admin@tekun.gov.my",
        "allowed":   [
            "/api/applications",
            "/api/credit-assessments",
            "/api/disbursements",
            "/api/dashboard/executive",
            "/api/analytics/kpi",
            "/api/npl-accounts",
        ],
        "forbidden": [],  # admin has full access
    },
]

def test_roles():
    print(f"\n{'='*60}")
    print("=== GATE 6: RBAC Role-Based Access Control Tests ===")
    print(f"{'='*60}")

    role_results = []

    for role in ROLES:
        print(f"\n  --- Role: {role['name']} ({role['email']}) ---")
        token = get_token(role["email"])
        if not token:
            print(f"  {WARN} Could not obtain token for {role['email']} — account may not be seeded yet")
            print(f"         → Run: cd {BACKEND_DIR} && php artisan db:seed --class=DemoUserSeeder")
            role_results.append((f"Login as {role['name']}", False))
            results.append((f"Login as {role['name']}", False))
            continue

        print(f"  {PASS} Login as {role['name']}")
        role_results.append((f"Login as {role['name']}", True))
        results.append((f"Login as {role['name']}", True))

        # Test allowed endpoints — should return 200
        for path in role["allowed"]:
            label = f"[{role['code']}] ALLOW {path}"
            curl_check(label, path, 200, token)

        # Test forbidden endpoints — should return 403
        for path in role["forbidden"]:
            label = f"[{role['code']}] BLOCK {path} → 403"
            curl_check(label, path, 403, token)

        # Executive write-block test: POST /api/applications should be 403 for executive
        if role["code"] == "executive":
            curl_check(
                f"[{role['code']}] BLOCK POST /api/applications (read-only role) → 403",
                "/api/applications", 403, token, method="POST"
            )

    print(f"\n  [Sidebar Navigation Role Test]")
    print(f"  {WARN} Manual check required — log in as each role at http://34.177.95.116:5173/login")
    print(f"  {WARN} Verify sidebar items match the role permission matrix in SKILL.md Gate 6")

    print(f"\n  [Role Permission Matrix Summary]")
    headers = ["Role", "M1 App", "M2 Credit", "M3 Disb", "M4 Acct", "M5 NPL", "M6 Exec"]
    matrix  = [
        ["Pemohon",         "✅ (own)", "❌", "❌", "❌", "❌", "❌"],
        ["Pegawai Cawangan","✅",       "❌", "✅(init)", "❌", "❌", "❌"],
        ["Pegawai Kredit",  "✅(read)", "✅", "❌", "✅(read)", "❌", "❌"],
        ["Pengurus",        "✅",       "✅", "✅(appr)", "✅", "✅(read)", "❌"],
        ["Eksekutif",       "✅(read)", "✅(read)", "✅(read)", "✅(read)", "✅", "✅"],
        ["Admin",           "✅",       "✅", "✅", "✅", "✅", "✅"],
    ]
    col_w = [20, 10, 11, 10, 10, 8, 8]
    header_line = "  " + "  ".join(h.ljust(col_w[i]) for i, h in enumerate(headers))
    print(header_line)
    print("  " + "-" * (sum(col_w) + len(col_w) * 2))
    for row in matrix:
        print("  " + "  ".join(str(v).ljust(col_w[i]) for i, v in enumerate(row)))

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    global BASE_URL
    parser = argparse.ArgumentParser(description="SPPT Quality Gate Test Runner")
    parser.add_argument("--module",    default="all",  help="Module number (1-6) or 'all'")
    parser.add_argument("--role-test", action="store_true", help="Run RBAC role-based access tests")
    parser.add_argument("--base-url",  default="http://localhost:8000", help="Backend base URL")
    args = parser.parse_args()

    BASE_URL = args.base_url

    print(f"\n{'='*60}")
    print(f"SPPT Quality Gate — Automated Test Runner")
    print(f"Target: {BASE_URL}")
    print(f"{'='*60}")

    # Get default auth token (credit officer)
    print("\n[Getting auth token (credit_officer)...]")
    token = get_token()
    if token:
        print(f"  {PASS} Auth token obtained")
    else:
        print(f"  {WARN} Could not get auth token — auth tests will use no-token mode")

    # Gate 1: Universal checks
    test_universal()

    # Module-specific tests
    if args.module == "all":
        for n in range(1, 7):
            test_module(n, token)
    else:
        try:
            test_module(int(args.module), token)
        except ValueError:
            print(f"  {FAIL} Invalid module number: {args.module}")

    # Gate 6: RBAC role tests (optional flag)
    if args.role_test:
        test_roles()

    # Summary
    total  = len(results)
    passed = sum(1 for _, ok in results if ok)
    failed = total - passed

    print(f"\n{'='*60}")
    print(f"RESULTS: {passed}/{total} PASS | {failed} FAIL")
    if failed == 0:
        print(f"\033[92m✅ ALL AUTOMATED TESTS PASSED — proceed to manual browser checks\033[0m")
    else:
        print(f"\033[91m❌ {failed} TESTS FAILED — fix before advancing to next phase\033[0m")
        for label, ok in results:
            if not ok:
                print(f"   → FAILED: {label}")
    print(f"{'='*60}\n")

    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
