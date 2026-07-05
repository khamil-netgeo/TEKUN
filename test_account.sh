#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tekun.gov.my","password":"demo1234"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token',''))")
echo "Token: ${TOKEN:0:40}..."
echo ""
echo "=== GET /api/accounts ==="
curl -s -X GET "http://localhost:8000/api/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>&1 | head -20
echo ""
echo "=== GET /api/accounts/1 ==="
curl -s -X GET "http://localhost:8000/api/accounts/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>&1 | head -20
echo ""
echo "=== GET /api/accounts/1/tawidh ==="
curl -s -X GET "http://localhost:8000/api/accounts/1/tawidh" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>&1 | head -20
echo ""
echo "=== POST /api/accounts/1/payment ==="
curl -s -X POST "http://localhost:8000/api/accounts/1/payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"channel":"fpx","reference":"TEST-001"}' | python3 -m json.tool 2>&1 | head -20
