#!/usr/bin/env bash
set -Eeuo pipefail

# WareHouse backend procurement flow: steps 43-59
#
# Terminal 1 (repo root):
#   npm run dev:api
#
# Terminal 2 (repo root):
#   bash purchase-order-flow.sh
#
# Optional overrides:
#   BASE_URL=http://localhost:3001
#   DEMO_EMAIL=admin@warehouse.local
#   DEMO_PASSWORD=warehouse-demo-password-2026
#   ORG_ID=<uuid>
#   WAREHOUSE_ID=<uuid>
#   PRODUCT_ID=<uuid>
#
# DEV/LOCAL ONLY: successful receipt tests create audit data and increase stock.

BASE_URL="${BASE_URL:-http://localhost:3001}"
DEMO_EMAIL="${DEMO_EMAIL:-admin@warehouse.local}"
DEMO_PASSWORD="${DEMO_PASSWORD:-warehouse-demo-password-2026}"
ORG_ID="${ORG_ID:-}"
WAREHOUSE_ID="${WAREHOUSE_ID:-}"
PRODUCT_ID="${PRODUCT_ID:-}"

ROOT_DIR="$(pwd)"
if [[ ! -d "$ROOT_DIR/apps/api" ]]; then
  SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  [[ -d "$SCRIPT_DIR/apps/api" ]] && ROOT_DIR="$SCRIPT_DIR"
fi
API_DIR="$ROOT_DIR/apps/api"

[[ -d "$API_DIR" ]] || { echo "❌ Nie znaleziono apps/api. Uruchom skrypt z root repo WareHouse."; exit 1; }
for cmd in curl node npx; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "❌ Brakuje komendy: $cmd"; exit 1; }
done

TMP_BODY="$(mktemp)"
TMP_A="$(mktemp)"
TMP_B="$(mktemp)"
HTTP_CODE=""
BODY=""
ACCESS_TOKEN=""
USER_ID=""
ROLE_CHANGED=0
SUPPLIER_ID=""
SUPPLIER_CODE=""
SECOND_PRODUCT_ID=""
PO1_ID=""; PO1_ITEM_ID=""; PO1_RECEIPT_1_ID=""
PO2_ID=""; PO2_ITEM_ID=""
PO3_ID=""; PO3_ITEM_ID=""
PO_WORKER_RECEIVE_ID=""; PO_WORKER_RECEIVE_ITEM_ID=""; PO_WORKER_DENIED_ID=""
TENANT_B_EMAIL=""; TENANT_B_SLUG=""; TENANT_B_TOKEN=""; TENANT_B_ORG_ID=""
TENANT_B_SUPPLIER_ID=""; TENANT_B_WAREHOUSE_ID=""; TENANT_B_PO_ID=""

pass() { printf '✅ %s\n' "$*"; }
info() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
fail() {
  printf '❌ %s\n' "$*" >&2
  if [[ -s "$TMP_BODY" ]]; then
    printf '%s\n' '--- response body ---' >&2
    cat "$TMP_BODY" >&2 || true
    printf '\n%s\n' '---------------------' >&2
  fi
  exit 1
}

json_get() {
  local json="$1" path="$2"
  printf '%s' "$json" | node -e '
    const fs = require("fs");
    const path = process.argv[1].split(".");
    let value = JSON.parse(fs.readFileSync(0, "utf8"));
    for (const key of path) value = value?.[key];
    if (value === undefined || value === null) process.exit(2);
    process.stdout.write(typeof value === "object" ? JSON.stringify(value) : String(value));
  ' "$path"
}

get_token_field() {
  local json="$1" field="$2" value
  value="$(json_get "$json" "tokens.$field" 2>/dev/null || true)"
  [[ -n "$value" ]] || value="$(json_get "$json" "$field" 2>/dev/null || true)"
  printf '%s' "$value"
}

request() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}"
  local args=(-sS -o "$TMP_BODY" -w "%{http_code}" -X "$method" "$url")
  [[ -z "$body" ]] || args+=(-H "Content-Type: application/json" -d "$body")
  [[ -z "$token" ]] || args+=(-H "Authorization: Bearer $token")
  HTTP_CODE="$(curl "${args[@]}")" || fail "Nie można połączyć się z $url"
  BODY="$(cat "$TMP_BODY")"
}

expect_status() { [[ "$HTTP_CODE" == "$1" ]] || fail "Oczekiwano HTTP $1, otrzymano $HTTP_CODE"; }
expect_2xx() { [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]] || fail "Oczekiwano 2xx, otrzymano $HTTP_CODE"; }
expect_message_contains() {
  local actual
  actual="$(json_get "$BODY" message 2>/dev/null || true)"
  [[ "$actual" == *"$1"* ]] || fail "Oczekiwano message zawierającego '$1', otrzymano '$actual'"
}

decimal_fixed_3() {
  node -e 'const n=Number(process.argv[1]); if(!Number.isFinite(n)) process.exit(2); process.stdout.write(n.toFixed(3));' "$1"
}
decimal_add() {
  node -e 'const a=Number(process.argv[1]),b=Number(process.argv[2]); if(!Number.isFinite(a)||!Number.isFinite(b)) process.exit(2); process.stdout.write((a+b).toFixed(3));' "$1" "$2"
}

first_active_warehouse_id() {
  printf '%s' "$1" | node -e '
    const fs=require("fs"); const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=Array.isArray(b)?b:(b.items??b.data??[]); const x=xs.find(v=>v?.isActive!==false);
    if(!x?.id) process.exit(2); process.stdout.write(String(x.id));
  '
}

first_two_product_ids() {
  printf '%s' "$1" | node -e '
    const fs=require("fs"); const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=(Array.isArray(b)?b:(b.items??b.data??[])).filter(v=>v?.isActive!==false);
    process.stdout.write(`${xs[0]?.id??""}\n${xs[1]?.id??""}`);
  '
}

inventory_quantity() {
  local json="$1" product_id="$2"
  printf '%s' "$json" | node -e '
    const fs=require("fs"); const pid=process.argv[1]; const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=Array.isArray(b)?b:(b.items??b.data??[]);
    const x=xs.find(v=>String(v?.product?.id??v?.productId??"")===pid);
    process.stdout.write(String(x?.quantity??0));
  ' "$product_id"
}

po_first_item_id() {
  printf '%s' "$1" | node -e '
    const fs=require("fs"); const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=b.items??b.purchaseOrderItems??[]; if(!xs[0]?.id) process.exit(2); process.stdout.write(String(xs[0].id));
  '
}

po_item_number() {
  local json="$1" item_id="$2" field="$3"
  printf '%s' "$json" | node -e '
    const fs=require("fs"); const id=process.argv[1],f=process.argv[2]; const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=b.items??b.purchaseOrderItems??[]; const x=xs.find(v=>String(v?.id)===id); if(!x) process.exit(2);
    if(f==="remainingQuantity") {
      if(x.remainingQuantity!==undefined&&x.remainingQuantity!==null) process.stdout.write(String(x.remainingQuantity));
      else process.stdout.write(String(Number(x.orderedQuantity??0)-Number(x.receivedQuantity??0)));
    } else {
      const v=x?.[f]; if(v===undefined||v===null) process.exit(2); process.stdout.write(String(v));
    }
  ' "$item_id" "$field"
}

po_receipt_count_if_present() {
  printf '%s' "$1" | node -e '
    const fs=require("fs"); const b=JSON.parse(fs.readFileSync(0,"utf8"));
    process.stdout.write(Array.isArray(b?.receipts)?String(b.receipts.length):"-1");
  '
}

movement_count() {
  local json="$1" product_id="$2"
  printf '%s' "$json" | node -e '
    const fs=require("fs"); const pid=process.argv[1]; const b=JSON.parse(fs.readFileSync(0,"utf8"));
    const xs=Array.isArray(b)?b:(b.items??b.data??[]);
    process.stdout.write(String(xs.filter(v=>String(v?.product?.id??v?.productId??"")===pid).length));
  ' "$product_id"
}

assert_receipt_movement() {
  local json="$1" product_id="$2" receipt_id="$3" delta="$4"
  printf '%s' "$json" | node -e '
    const fs=require("fs"); const pid=process.argv[1],rid=process.argv[2],delta=Number(process.argv[3]);
    const b=JSON.parse(fs.readFileSync(0,"utf8")); const xs=Array.isArray(b)?b:(b.items??b.data??[]);
    const x=xs.find(v=>String(v?.product?.id??v?.productId??"")===pid && v?.type==="RECEIPT" && Math.abs(Number(v?.delta)-delta)<0.0005 && (String(v?.purchaseReceiptId??v?.purchaseReceipt?.id??"")===rid || String(v?.operationId??"")===rid));
    if(!x) process.exit(2);
    if(x.purchaseReceiptId!==undefined && String(x.purchaseReceiptId)!==rid) process.exit(3);
    if(x.operationId!==undefined && String(x.operationId)!==rid) process.exit(4);
  ' "$product_id" "$receipt_id" "$delta"
}

prisma_exec() {
  local config_args=()
  [[ -f "$API_DIR/prisma7.config.ts" ]] && config_args=(--config prisma7.config.ts)
  [[ -f "$API_DIR/prisma.config.ts" ]] && config_args=(--config prisma.config.ts)
  (cd "$API_DIR" && npx prisma db execute "${config_args[@]}" --stdin >/dev/null)
}

set_demo_role() {
  cat <<SQL | prisma_exec
UPDATE "Membership"
SET "role" = '$1'
WHERE "userId" = '$USER_ID' AND "organizationId" = '$ORG_ID';
SQL
}

cleanup_tenant_b() {
  [[ -n "$TENANT_B_EMAIL" && -n "$TENANT_B_SLUG" ]] || return 0
  cat <<SQL | prisma_exec >/dev/null 2>&1 || true
DELETE FROM "PurchaseOrderItem" WHERE "purchaseOrderId" IN (
  SELECT po."id" FROM "PurchaseOrder" po JOIN "Organization" o ON o."id"=po."organizationId" WHERE o."slug"='$TENANT_B_SLUG'
);
DELETE FROM "PurchaseOrder" WHERE "organizationId" IN (SELECT "id" FROM "Organization" WHERE "slug"='$TENANT_B_SLUG');
DELETE FROM "Supplier" WHERE "organizationId" IN (SELECT "id" FROM "Organization" WHERE "slug"='$TENANT_B_SLUG');
DELETE FROM "Inventory" WHERE "warehouseId" IN (
  SELECT w."id" FROM "Warehouse" w JOIN "Organization" o ON o."id"=w."organizationId" WHERE o."slug"='$TENANT_B_SLUG'
);
DELETE FROM "Warehouse" WHERE "organizationId" IN (SELECT "id" FROM "Organization" WHERE "slug"='$TENANT_B_SLUG');
DELETE FROM "Membership" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email"='$TENANT_B_EMAIL');
DELETE FROM "RefreshSession" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email"='$TENANT_B_EMAIL');
DELETE FROM "User" WHERE "email"='$TENANT_B_EMAIL';
DELETE FROM "Organization" WHERE "slug"='$TENANT_B_SLUG';
SQL
}

cleanup() {
  set +e
  if [[ "$ROLE_CHANGED" == "1" ]]; then
    echo "↩ Przywracam Demo User do OWNER..."
    set_demo_role OWNER >/dev/null 2>&1 || true
  fi
  cleanup_tenant_b
  rm -f "$TMP_BODY" "$TMP_A" "$TMP_B" "${TMP_A}.body" "${TMP_A}.status" "${TMP_B}.body" "${TMP_B}.status"
}
trap cleanup EXIT

get_inventory_body() {
  request GET "$BASE_URL/organizations/$ORG_ID/warehouses/$WAREHOUSE_ID/inventory" "" "$ACCESS_TOKEN"
  expect_status 200
}
get_po() {
  request GET "$BASE_URL/organizations/$ORG_ID/purchase-orders/$1" "" "$ACCESS_TOKEN"
  expect_status 200
}
get_movements() {
  request GET "$BASE_URL/organizations/$ORG_ID/stock-movements?productId=$PRODUCT_ID" "" "$ACCESS_TOKEN"
  expect_status 200
}
create_po() {
  request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders" "{\"supplierId\":\"$SUPPLIER_ID\",\"warehouseId\":\"$WAREHOUSE_ID\",\"currency\":\"USD\",\"note\":\"$1\"}" "$ACCESS_TOKEN"
  expect_status 201
  json_get "$BODY" id
}
add_po_item() {
  request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$1/items" "{\"productId\":\"$2\",\"orderedQuantity\":\"$3\",\"unitCost\":\"$4\"}" "$ACCESS_TOKEN"
}
submit_po() {
  request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$1/submit" "" "$ACCESS_TOKEN"
}

info "Login + resolve Organization / Warehouse / Product"
request POST "$BASE_URL/auth/login" "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}"
expect_status 200
ACCESS_TOKEN="$(get_token_field "$BODY" accessToken)"
USER_ID="$(json_get "$BODY" user.id 2>/dev/null || true)"
[[ -n "$ORG_ID" ]] || ORG_ID="$(json_get "$BODY" user.memberships.0.organization.id 2>/dev/null || true)"
if [[ -z "$ORG_ID" || -z "$USER_ID" ]]; then
  request GET "$BASE_URL/auth/me" "" "$ACCESS_TOKEN"; expect_status 200
  [[ -n "$USER_ID" ]] || USER_ID="$(json_get "$BODY" id 2>/dev/null || true)"
  [[ -n "$ORG_ID" ]] || ORG_ID="$(json_get "$BODY" memberships.0.organization.id 2>/dev/null || true)"
fi
[[ -n "$ACCESS_TOKEN" && -n "$USER_ID" && -n "$ORG_ID" ]] || fail "Nie udało się ustalić login/user/org"

request GET "$BASE_URL/organizations/$ORG_ID/warehouses" "" "$ACCESS_TOKEN"; expect_status 200
[[ -n "$WAREHOUSE_ID" ]] || WAREHOUSE_ID="$(first_active_warehouse_id "$BODY" 2>/dev/null || true)"
[[ -n "$WAREHOUSE_ID" ]] || fail "Brak aktywnego Warehouse"

request GET "$BASE_URL/organizations/$ORG_ID/products" "" "$ACCESS_TOKEN"; expect_status 200
mapfile -t PRODUCT_IDS < <(first_two_product_ids "$BODY")
[[ -n "$PRODUCT_ID" ]] || PRODUCT_ID="${PRODUCT_IDS[0]:-}"
SECOND_PRODUCT_ID="${PRODUCT_IDS[1]:-}"
[[ -n "$PRODUCT_ID" ]] || fail "Brak aktywnego Product"
pass "ORG_ID=$ORG_ID"
pass "WAREHOUSE_ID=$WAREHOUSE_ID"
pass "PRODUCT_ID=$PRODUCT_ID"

STAMP="$(date +%s)-$$"
SUPPLIER_CODE_RAW="apple-dist-auto-$STAMP"
SUPPLIER_CODE="$(printf '%s' "$SUPPLIER_CODE_RAW" | tr '[:lower:]' '[:upper:]')"

info "43. Create Supplier"
request POST "$BASE_URL/organizations/$ORG_ID/suppliers" "{\"code\":\"$SUPPLIER_CODE_RAW\",\"name\":\"Apple Distribution Automated\",\"contactName\":\"Procurement Team\",\"email\":\"orders-$STAMP@example.com\",\"phone\":\"+1-555-0100\",\"address\":\"Distribution Center\"}" "$ACCESS_TOKEN"
expect_status 201
SUPPLIER_ID="$(json_get "$BODY" id 2>/dev/null || true)"
CREATED_SUPPLIER_CODE="$(json_get "$BODY" code 2>/dev/null || true)"
[[ -n "$SUPPLIER_ID" ]] || fail "Supplier nie zwrócił id"
[[ "$CREATED_SUPPLIER_CODE" == "$SUPPLIER_CODE" ]] || fail "Supplier code nie został znormalizowany. Oczekiwano $SUPPLIER_CODE, jest $CREATED_SUPPLIER_CODE"
pass "Supplier -> 201, code=$CREATED_SUPPLIER_CODE"

info "44. Duplicate Supplier code"
request POST "$BASE_URL/organizations/$ORG_ID/suppliers" "{\"code\":\"$SUPPLIER_CODE\",\"name\":\"Duplicate Supplier\"}" "$ACCESS_TOKEN"
expect_status 409
expect_message_contains "Supplier with this code already exists"
pass "Duplicate Supplier -> 409"

info "45. Create Purchase Order"
PO1_ID="$(create_po "Initial procurement test")"
get_po "$PO1_ID"
PO1_STATUS="$(json_get "$BODY" status 2>/dev/null || true)"
PO1_NUMBER="$(json_get "$BODY" number 2>/dev/null || json_get "$BODY" code 2>/dev/null || true)"
[[ "$PO1_STATUS" == "DRAFT" ]] || fail "Nowy PO powinien być DRAFT, jest $PO1_STATUS"
pass "PO -> id=$PO1_ID, number=${PO1_NUMBER:-n/a}, status=DRAFT"

info "46. Add item orderedQuantity=10.000"
add_po_item "$PO1_ID" "$PRODUCT_ID" "10.000" "999.99"; expect_status 201
get_po "$PO1_ID"
PO1_ITEM_ID="$(po_first_item_id "$BODY" 2>/dev/null || true)"
[[ -n "$PO1_ITEM_ID" ]] || fail "Nie udało się ustalić PO_ITEM_ID"
pass "PO item -> 201, id=$PO1_ITEM_ID"

info "47. Duplicate Product on the same PO"
add_po_item "$PO1_ID" "$PRODUCT_ID" "10.000" "999.99"
expect_status 409
expect_message_contains "This product is already present on the purchase order"
pass "Duplicate PO product -> 409"

info "48. Submit PO"
submit_po "$PO1_ID"; expect_2xx
get_po "$PO1_ID"
STATUS="$(json_get "$BODY" status 2>/dev/null || true)"
[[ "$STATUS" == "SUBMITTED" ]] || fail "Po submit oczekiwano SUBMITTED, jest $STATUS"
pass "PO -> SUBMITTED"

info "49. Submitted PO is immutable"
PRODUCT_FOR_SECOND_ITEM="$SECOND_PRODUCT_ID"; [[ -n "$PRODUCT_FOR_SECOND_ITEM" ]] || PRODUCT_FOR_SECOND_ITEM="$PRODUCT_ID"
add_po_item "$PO1_ID" "$PRODUCT_FOR_SECOND_ITEM" "1.000" "1.00"; expect_status 409
pass "Add item after submit -> 409"
request DELETE "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO1_ID/items/$PO1_ITEM_ID" "" "$ACCESS_TOKEN"
expect_status 409
pass "Delete item after submit -> 409"

info "50-53. First partial receipt = 4.000"
get_inventory_body; QTY_BEFORE_PARTIAL="$(inventory_quantity "$BODY" "$PRODUCT_ID")"
get_movements; MOVEMENTS_BEFORE_PARTIAL="$(movement_count "$BODY" "$PRODUCT_ID")"
get_po "$PO1_ID"; RECEIPTS_BEFORE_PARTIAL="$(po_receipt_count_if_present "$BODY")"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO1_ID/receipts" "{\"items\":[{\"purchaseOrderItemId\":\"$PO1_ITEM_ID\",\"quantity\":\"4.000\"}],\"note\":\"First delivery\"}" "$ACCESS_TOKEN"
expect_status 201
PO1_RECEIPT_1_ID="$(json_get "$BODY" id 2>/dev/null || true)"
[[ -n "$PO1_RECEIPT_1_ID" ]] || warn "Receipt response nie ma top-level id; movement correlation będzie ograniczona."
get_inventory_body; QTY_AFTER_PARTIAL="$(inventory_quantity "$BODY" "$PRODUCT_ID")"; EXPECTED_PARTIAL="$(decimal_add "$QTY_BEFORE_PARTIAL" "4")"
[[ "$(decimal_fixed_3 "$QTY_AFTER_PARTIAL")" == "$EXPECTED_PARTIAL" ]] || fail "Inventory po partial receipt: oczekiwano $EXPECTED_PARTIAL, jest $QTY_AFTER_PARTIAL"
get_po "$PO1_ID"
STATUS="$(json_get "$BODY" status 2>/dev/null || true)"
ORDERED="$(po_item_number "$BODY" "$PO1_ITEM_ID" orderedQuantity)"
RECEIVED="$(po_item_number "$BODY" "$PO1_ITEM_ID" receivedQuantity)"
REMAINING="$(po_item_number "$BODY" "$PO1_ITEM_ID" remainingQuantity)"
[[ "$STATUS" == "PARTIALLY_RECEIVED" ]] || fail "Oczekiwano PARTIALLY_RECEIVED, jest $STATUS"
[[ "$(decimal_fixed_3 "$ORDERED")" == "10.000" ]] || fail "orderedQuantity != 10"
[[ "$(decimal_fixed_3 "$RECEIVED")" == "4.000" ]] || fail "receivedQuantity != 4"
[[ "$(decimal_fixed_3 "$REMAINING")" == "6.000" ]] || fail "remainingQuantity != 6"
if [[ "$RECEIPTS_BEFORE_PARTIAL" != "-1" ]]; then
  RECEIPTS_AFTER_PARTIAL="$(po_receipt_count_if_present "$BODY")"
  [[ "$RECEIPTS_AFTER_PARTIAL" -eq $((RECEIPTS_BEFORE_PARTIAL + 1)) ]] || fail "PO receipts count nie zwiększył się o 1"
fi
get_movements; MOVEMENTS_AFTER_PARTIAL="$(movement_count "$BODY" "$PRODUCT_ID")"
[[ "$MOVEMENTS_AFTER_PARTIAL" -eq $((MOVEMENTS_BEFORE_PARTIAL + 1)) ]] || fail "StockMovement count po partial receipt nie zwiększył się o 1"
if [[ -n "$PO1_RECEIPT_1_ID" ]]; then
  assert_receipt_movement "$BODY" "$PRODUCT_ID" "$PO1_RECEIPT_1_ID" "4" || fail "Nie znaleziono poprawnego RECEIPT movement dla PurchaseReceipt=$PO1_RECEIPT_1_ID delta=4"
fi
pass "Partial receipt -> +4 inventory, received=4, remaining=6, PARTIALLY_RECEIVED"
pass "StockMovement RECEIPT -> +4"

info "54. Second delivery = 6.000"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO1_ID/receipts" "{\"items\":[{\"purchaseOrderItemId\":\"$PO1_ITEM_ID\",\"quantity\":\"6.000\"}],\"note\":\"Final delivery\"}" "$ACCESS_TOKEN"
expect_status 201
get_inventory_body; QTY_AFTER_SECOND="$(inventory_quantity "$BODY" "$PRODUCT_ID")"; EXPECTED_SECOND="$(decimal_add "$QTY_AFTER_PARTIAL" "6")"
[[ "$(decimal_fixed_3 "$QTY_AFTER_SECOND")" == "$EXPECTED_SECOND" ]] || fail "Inventory po drugim receipt: oczekiwano $EXPECTED_SECOND, jest $QTY_AFTER_SECOND"
get_po "$PO1_ID"
STATUS="$(json_get "$BODY" status 2>/dev/null || true)"
RECEIVED="$(po_item_number "$BODY" "$PO1_ITEM_ID" receivedQuantity)"
REMAINING="$(po_item_number "$BODY" "$PO1_ITEM_ID" remainingQuantity)"
RECEIVED_AT="$(json_get "$BODY" receivedAt 2>/dev/null || true)"
[[ "$STATUS" == "RECEIVED" ]] || fail "Oczekiwano RECEIVED, jest $STATUS"
[[ "$(decimal_fixed_3 "$RECEIVED")" == "10.000" ]] || fail "receivedQuantity != 10"
[[ "$(decimal_fixed_3 "$REMAINING")" == "0.000" ]] || fail "remainingQuantity != 0"
[[ -n "$RECEIVED_AT" ]] || fail "receivedAt powinno być ustawione"
pass "Second receipt -> +6, received=10, remaining=0, RECEIVED"

info "55. Receive after PO is already RECEIVED"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO1_ID/receipts" "{\"items\":[{\"purchaseOrderItemId\":\"$PO1_ITEM_ID\",\"quantity\":\"1.000\"}]}" "$ACCESS_TOKEN"
expect_status 409
expect_message_contains "Purchase order is not open for receiving"
pass "Extra receipt after RECEIVED -> 409"

info "56. Over-receive must rollback"
PO2_ID="$(create_po "Over-receive rollback test")"
add_po_item "$PO2_ID" "$PRODUCT_ID" "10.000" "10.00"; expect_status 201
submit_po "$PO2_ID"; expect_2xx
get_po "$PO2_ID"; PO2_ITEM_ID="$(po_first_item_id "$BODY")"; RECEIPTS_BEFORE_OVER="$(po_receipt_count_if_present "$BODY")"
get_inventory_body; QTY_BEFORE_OVER="$(inventory_quantity "$BODY" "$PRODUCT_ID")"
get_movements; MOVEMENTS_BEFORE_OVER="$(movement_count "$BODY" "$PRODUCT_ID")"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO2_ID/receipts" "{\"items\":[{\"purchaseOrderItemId\":\"$PO2_ITEM_ID\",\"quantity\":\"11.000\"}],\"note\":\"Must rollback\"}" "$ACCESS_TOKEN"
expect_status 409
expect_message_contains "Received quantity exceeds the remaining ordered quantity"
get_inventory_body; QTY_AFTER_OVER="$(inventory_quantity "$BODY" "$PRODUCT_ID")"
[[ "$(decimal_fixed_3 "$QTY_AFTER_OVER")" == "$(decimal_fixed_3 "$QTY_BEFORE_OVER")" ]] || fail "Over-receive zmienił Inventory"
get_po "$PO2_ID"; RECEIVED_OVER="$(po_item_number "$BODY" "$PO2_ITEM_ID" receivedQuantity)"
[[ "$(decimal_fixed_3 "$RECEIVED_OVER")" == "0.000" ]] || fail "Over-receive zmienił receivedQuantity na $RECEIVED_OVER"
if [[ "$RECEIPTS_BEFORE_OVER" != "-1" ]]; then
  RECEIPTS_AFTER_OVER="$(po_receipt_count_if_present "$BODY")"
  [[ "$RECEIPTS_AFTER_OVER" == "$RECEIPTS_BEFORE_OVER" ]] || fail "Over-receive utworzył PurchaseReceipt mimo rollback"
fi
get_movements; MOVEMENTS_AFTER_OVER="$(movement_count "$BODY" "$PRODUCT_ID")"
[[ "$MOVEMENTS_AFTER_OVER" == "$MOVEMENTS_BEFORE_OVER" ]] || fail "Over-receive utworzył StockMovement mimo rollback"
pass "Over-receive -> 409 i pełny rollback"

info "57. Concurrency: two simultaneous receipts 7 + 7 against ordered 10"
PO3_ID="$(create_po "Concurrent receiving test")"
add_po_item "$PO3_ID" "$PRODUCT_ID" "10.000" "10.00"; expect_status 201
submit_po "$PO3_ID"; expect_2xx
get_po "$PO3_ID"; PO3_ITEM_ID="$(po_first_item_id "$BODY")"
get_inventory_body; QTY_BEFORE_CONCURRENCY="$(inventory_quantity "$BODY" "$PRODUCT_ID")"
get_movements; MOVEMENTS_BEFORE_CONCURRENCY="$(movement_count "$BODY" "$PRODUCT_ID")"

receive_concurrent() {
  local outfile="$1"
  curl -sS -o "${outfile}.body" -w "%{http_code}" -X POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO3_ID/receipts" \
    -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
    -d "{\"items\":[{\"purchaseOrderItemId\":\"$PO3_ITEM_ID\",\"quantity\":\"7.000\"}],\"note\":\"Concurrent delivery\"}" > "${outfile}.status"
}
receive_concurrent "$TMP_A" & PID_A=$!
receive_concurrent "$TMP_B" & PID_B=$!
wait "$PID_A"; wait "$PID_B"
STATUS_A="$(cat "${TMP_A}.status")"; STATUS_B="$(cat "${TMP_B}.status")"
SUCCESS_COUNT=0; CONFLICT_COUNT=0
for status in "$STATUS_A" "$STATUS_B"; do
  [[ "$status" =~ ^20[0-9]$ ]] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  [[ "$status" == "409" ]] && CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
done
[[ "$SUCCESS_COUNT" -eq 1 && "$CONFLICT_COUNT" -eq 1 ]] || {
  echo "Request A -> HTTP $STATUS_A"; echo "Request B -> HTTP $STATUS_B"
  fail "Concurrency: oczekiwano dokładnie jednego 2xx i jednego 409"
}
get_po "$PO3_ID"; CONCURRENT_RECEIVED="$(po_item_number "$BODY" "$PO3_ITEM_ID" receivedQuantity)"
[[ "$(decimal_fixed_3 "$CONCURRENT_RECEIVED")" == "7.000" ]] || fail "Concurrency: receivedQuantity powinno być 7.000, jest $CONCURRENT_RECEIVED"
get_inventory_body; QTY_AFTER_CONCURRENCY="$(inventory_quantity "$BODY" "$PRODUCT_ID")"; EXPECTED_CONCURRENCY="$(decimal_add "$QTY_BEFORE_CONCURRENCY" "7")"
[[ "$(decimal_fixed_3 "$QTY_AFTER_CONCURRENCY")" == "$EXPECTED_CONCURRENCY" ]] || fail "Concurrency: Inventory powinno wzrosnąć tylko o 7"
get_movements; MOVEMENTS_AFTER_CONCURRENCY="$(movement_count "$BODY" "$PRODUCT_ID")"
[[ "$MOVEMENTS_AFTER_CONCURRENCY" -eq $((MOVEMENTS_BEFORE_CONCURRENCY + 1)) ]] || fail "Concurrency: powinien powstać dokładnie 1 StockMovement"
pass "Concurrency -> HTTP $STATUS_A / $STATUS_B, final received=7, Inventory +7"

info "58. Tenant isolation"
TENANT_B_EMAIL="procurement-tenant-$STAMP@example.com"; TENANT_B_SLUG="procurement-tenant-$STAMP"
request POST "$BASE_URL/auth/register" "{\"firstName\":\"Tenant\",\"lastName\":\"B\",\"email\":\"$TENANT_B_EMAIL\",\"password\":\"this-is-a-long-test-password\",\"organizationName\":\"Procurement Tenant B $STAMP\",\"organizationSlug\":\"$TENANT_B_SLUG\"}"
expect_2xx
TENANT_B_TOKEN="$(get_token_field "$BODY" accessToken)"; TENANT_B_ORG_ID="$(json_get "$BODY" user.memberships.0.organization.id 2>/dev/null || true)"
if [[ -z "$TENANT_B_ORG_ID" ]]; then request GET "$BASE_URL/auth/me" "" "$TENANT_B_TOKEN"; expect_status 200; TENANT_B_ORG_ID="$(json_get "$BODY" memberships.0.organization.id 2>/dev/null || true)"; fi
[[ -n "$TENANT_B_TOKEN" && -n "$TENANT_B_ORG_ID" ]] || fail "Nie udało się utworzyć Organization B"
request POST "$BASE_URL/organizations/$TENANT_B_ORG_ID/suppliers" "{\"code\":\"tenant-b-supplier-$STAMP\",\"name\":\"Tenant B Supplier\"}" "$TENANT_B_TOKEN"; expect_status 201
TENANT_B_SUPPLIER_ID="$(json_get "$BODY" id)"
request POST "$BASE_URL/organizations/$TENANT_B_ORG_ID/warehouses" "{\"name\":\"Tenant B Warehouse\",\"code\":\"tenant-b-wh-$STAMP\",\"address\":\"Tenant B\"}" "$TENANT_B_TOKEN"; expect_status 201
TENANT_B_WAREHOUSE_ID="$(json_get "$BODY" id)"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders" "{\"supplierId\":\"$TENANT_B_SUPPLIER_ID\",\"warehouseId\":\"$WAREHOUSE_ID\",\"currency\":\"USD\",\"note\":\"Cross-tenant supplier probe\"}" "$ACCESS_TOKEN"; expect_status 404
pass "Supplier B used in Organization A -> 404"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders" "{\"supplierId\":\"$SUPPLIER_ID\",\"warehouseId\":\"$TENANT_B_WAREHOUSE_ID\",\"currency\":\"USD\",\"note\":\"Cross-tenant warehouse probe\"}" "$ACCESS_TOKEN"; expect_status 404
pass "Warehouse B used in Organization A -> 404"
request POST "$BASE_URL/organizations/$TENANT_B_ORG_ID/purchase-orders" "{\"supplierId\":\"$TENANT_B_SUPPLIER_ID\",\"warehouseId\":\"$TENANT_B_WAREHOUSE_ID\",\"currency\":\"USD\",\"note\":\"Tenant B PO\"}" "$TENANT_B_TOKEN"; expect_status 201
TENANT_B_PO_ID="$(json_get "$BODY" id)"
request POST "$BASE_URL/organizations/$TENANT_B_ORG_ID/purchase-orders/$TENANT_B_PO_ID/items" "{\"productId\":\"$PRODUCT_ID\",\"orderedQuantity\":\"1.000\",\"unitCost\":\"1.00\"}" "$TENANT_B_TOKEN"; expect_status 404
pass "Product A used in Organization B -> 404"
request GET "$BASE_URL/organizations/$ORG_ID/purchase-orders/$TENANT_B_PO_ID" "" "$ACCESS_TOKEN"; expect_status 404
pass "PO B through Organization A URL -> 404"

info "59. RBAC WORKER"
PO_WORKER_RECEIVE_ID="$(create_po "WORKER receive allowed")"
add_po_item "$PO_WORKER_RECEIVE_ID" "$PRODUCT_ID" "1.000" "1.00"; expect_status 201
submit_po "$PO_WORKER_RECEIVE_ID"; expect_2xx
get_po "$PO_WORKER_RECEIVE_ID"; PO_WORKER_RECEIVE_ITEM_ID="$(po_first_item_id "$BODY")"
PO_WORKER_DENIED_ID="$(create_po "WORKER denied mutation probes")"

set_demo_role WORKER; ROLE_CHANGED=1
request GET "$BASE_URL/organizations/$ORG_ID/suppliers" "" "$ACCESS_TOKEN"; expect_status 200; pass "WORKER -> GET Suppliers = 200"
request GET "$BASE_URL/organizations/$ORG_ID/purchase-orders" "" "$ACCESS_TOKEN"; expect_status 200; pass "WORKER -> GET Purchase Orders = 200"
request POST "$BASE_URL/organizations/$ORG_ID/suppliers" "{\"code\":\"worker-denied-$STAMP\",\"name\":\"Worker denied supplier\"}" "$ACCESS_TOKEN"; expect_status 403; pass "WORKER -> Create Supplier = 403"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders" "{\"supplierId\":\"$SUPPLIER_ID\",\"warehouseId\":\"$WAREHOUSE_ID\",\"currency\":\"USD\"}" "$ACCESS_TOKEN"; expect_status 403; pass "WORKER -> Create PO = 403"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO_WORKER_DENIED_ID/items" "{\"productId\":\"$PRODUCT_ID\",\"orderedQuantity\":\"1.000\",\"unitCost\":\"1.00\"}" "$ACCESS_TOKEN"; expect_status 403; pass "WORKER -> Add PO item = 403"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO_WORKER_DENIED_ID/submit" "" "$ACCESS_TOKEN"; expect_status 403; pass "WORKER -> Submit PO = 403"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO_WORKER_DENIED_ID/cancel" "" "$ACCESS_TOKEN"; expect_status 403; pass "WORKER -> Cancel PO = 403"
get_inventory_body; QTY_BEFORE_WORKER_RECEIVE="$(inventory_quantity "$BODY" "$PRODUCT_ID")"
request POST "$BASE_URL/organizations/$ORG_ID/purchase-orders/$PO_WORKER_RECEIVE_ID/receipts" "{\"items\":[{\"purchaseOrderItemId\":\"$PO_WORKER_RECEIVE_ITEM_ID\",\"quantity\":\"1.000\"}],\"note\":\"Received by WORKER\"}" "$ACCESS_TOKEN"; expect_status 201
get_inventory_body; QTY_AFTER_WORKER_RECEIVE="$(inventory_quantity "$BODY" "$PRODUCT_ID")"; EXPECTED_WORKER_RECEIVE="$(decimal_add "$QTY_BEFORE_WORKER_RECEIVE" "1")"
[[ "$(decimal_fixed_3 "$QTY_AFTER_WORKER_RECEIVE")" == "$EXPECTED_WORKER_RECEIVE" ]] || fail "WORKER receipt nie zwiększył Inventory o 1"
pass "WORKER -> Receive PO = 201, Inventory +1"
set_demo_role OWNER; ROLE_CHANGED=0
pass "Membership przywrócony do OWNER"

printf '\n🎉 Wszystkie testy procurement 43-59 przeszły poprawnie.\n'
printf '\nZmiany w lokalnej bazie:\n'
printf '  • pełny PO receipt: +10.000 stock\n'
printf '  • concurrency receipt: +7.000 stock\n'
printf '  • WORKER receipt: +1.000 stock\n'
printf '  • over-receive: +0.000 stock\n'
printf '  • łącznie: +18.000 stock dla testowanego Product\n'
printf '  • główne PO/Receipt/StockMovement zostają jako audit/test data\n'
printf '  • tymczasowa Organization B jest usuwana best-effort przy wyjściu\n'
