#!/bin/bash

# ============================================================
# Advanced Todo API - Comprehensive Test Script
# ============================================================
# This script tests all API endpoints including CRUD operations,
# bulk operations, and large payload testing.
# 
# Usage: ./scripts/test-api.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000
# ============================================================

# Don't use set -e as it causes issues with arithmetic operations

BASE_URL="${1:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
CURRENT_SECTION=""

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    CURRENT_SECTION="$1"
    echo -e "${CYAN}Starting section: $1${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

pass() {
    echo -e "${GREEN}  ✓ PASSED${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}  ✗ FAILED${NC}: $1"
    if [ -n "$2" ]; then
        echo -e "${RED}    Response: ${NC}${2:0:200}"
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_progress() {
    echo -e "${CYAN}[PROGRESS]${NC} Tests passed: $TESTS_PASSED | Tests failed: $TESTS_FAILED"
}

# Extract ID from response
extract_id() {
    echo "$1" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://'
}

# ============================================================
# Start Testing
# ============================================================

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Advanced Todo API - Comprehensive Test Suite       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Base URL:${NC} $BASE_URL"
echo -e "${CYAN}API URL:${NC} $API_URL"
echo -e "${CYAN}Started at:${NC} $(date)"
echo ""

# ============================================================
# Health Check
# ============================================================
print_header "1. Health Check"

print_test "Checking server health..."
for i in {1..10}; do
    response=$(curl -s "$API_URL/health" 2>/dev/null || echo "")
    if echo "$response" | grep -q "ok"; then
        pass "Server is healthy and responding"
        break
    fi
    if [ $i -eq 10 ]; then
        fail "Server health check - Server not responding after 10 attempts"
        echo -e "${RED}Cannot proceed without a healthy server. Exiting.${NC}"
        exit 1
    fi
    echo "  Waiting for server... (attempt $i/10)"
    sleep 2
done

print_progress

# ============================================================
# Database Cleanup (for idempotent test runs)
# ============================================================
print_header "0. Database Cleanup"

print_test "Clearing database for fresh test run..."
response=$(curl -s -X DELETE "$API_URL/bulk/clear")
if echo "$response" | grep -q '"success":true'; then
    pass "Database cleared successfully"
else
    fail "Clear database" "$response"
fi

print_progress

# ============================================================
# Category Tests
# ============================================================
print_header "2. Category CRUD Tests"

print_test "Creating category 'Work'..."
response=$(curl -s -X POST "$API_URL/categories" \
    -H "Content-Type: application/json" \
    -d '{"name": "Work", "color": "#3B82F6", "description": "Work related tasks"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created category 'Work'"
    CATEGORY_ID_1=$(extract_id "$response")
    echo -e "    Created with ID: $CATEGORY_ID_1"
else
    fail "Create category 'Work'" "$response"
fi

print_test "Creating category 'Personal'..."
response=$(curl -s -X POST "$API_URL/categories" \
    -H "Content-Type: application/json" \
    -d '{"name": "Personal", "color": "#10B981", "description": "Personal tasks"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created category 'Personal'"
    CATEGORY_ID_2=$(extract_id "$response")
    echo -e "    Created with ID: $CATEGORY_ID_2"
else
    fail "Create category 'Personal'" "$response"
fi

print_test "Listing all categories..."
response=$(curl -s -X GET "$API_URL/categories")
if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | sed 's/"count"://')
    pass "Listed categories (count: $count)"
else
    fail "List categories" "$response"
fi

print_test "Getting category by ID..."
response=$(curl -s -X GET "$API_URL/categories/$CATEGORY_ID_1")
if echo "$response" | grep -q '"success":true'; then
    pass "Retrieved category by ID"
else
    fail "Get category by ID" "$response"
fi

print_test "Updating category..."
response=$(curl -s -X PUT "$API_URL/categories/$CATEGORY_ID_1" \
    -H "Content-Type: application/json" \
    -d '{"name": "Work Tasks", "color": "#2563EB"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Updated category"
else
    fail "Update category" "$response"
fi

print_progress

# ============================================================
# Tag Tests
# ============================================================
print_header "3. Tag CRUD Tests"

print_test "Creating tag 'urgent'..."
response=$(curl -s -X POST "$API_URL/tags" \
    -H "Content-Type: application/json" \
    -d '{"name": "urgent", "color": "#EF4444"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created tag 'urgent'"
    TAG_ID_1=$(extract_id "$response")
    echo -e "    Created with ID: $TAG_ID_1"
else
    fail "Create tag 'urgent'" "$response"
fi

print_test "Creating tag 'important'..."
response=$(curl -s -X POST "$API_URL/tags" \
    -H "Content-Type: application/json" \
    -d '{"name": "important", "color": "#F59E0B"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created tag 'important'"
    TAG_ID_2=$(extract_id "$response")
    echo -e "    Created with ID: $TAG_ID_2"
else
    fail "Create tag 'important'" "$response"
fi

print_test "Creating tag 'quick-task'..."
response=$(curl -s -X POST "$API_URL/tags" \
    -H "Content-Type: application/json" \
    -d '{"name": "quick-task", "color": "#10B981"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created tag 'quick-task'"
    TAG_ID_3=$(extract_id "$response")
    echo -e "    Created with ID: $TAG_ID_3"
else
    fail "Create tag 'quick-task'" "$response"
fi

print_test "Listing all tags..."
response=$(curl -s -X GET "$API_URL/tags")
if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | sed 's/"count"://')
    pass "Listed tags (count: $count)"
else
    fail "List tags" "$response"
fi

print_progress

# ============================================================
# Todo CRUD Tests
# ============================================================
print_header "4. Todo CRUD Tests"

print_test "Creating todo with tags..."
response=$(curl -s -X POST "$API_URL/todos" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Complete project report\", \"description\": \"Write the quarterly report for Q4\", \"priority\": 3, \"categoryId\": $CATEGORY_ID_1, \"tagIds\": [$TAG_ID_1, $TAG_ID_2]}")
if echo "$response" | grep -q '"success":true'; then
    pass "Created todo with tags"
    TODO_ID_1=$(extract_id "$response")
    echo -e "    Created with ID: $TODO_ID_1"
else
    fail "Create todo with tags" "$response"
fi

print_test "Creating todo without tags..."
response=$(curl -s -X POST "$API_URL/todos" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Buy groceries\", \"description\": \"Milk, eggs, bread, and vegetables\", \"priority\": 2, \"categoryId\": $CATEGORY_ID_2}")
if echo "$response" | grep -q '"success":true'; then
    pass "Created todo without tags"
    TODO_ID_2=$(extract_id "$response")
    echo -e "    Created with ID: $TODO_ID_2"
else
    fail "Create todo without tags" "$response"
fi

print_test "Creating todo without category..."
response=$(curl -s -X POST "$API_URL/todos" \
    -H "Content-Type: application/json" \
    -d '{"title": "Call mom", "description": "Weekly catch-up call", "priority": 1}')
if echo "$response" | grep -q '"success":true'; then
    pass "Created todo without category"
    TODO_ID_3=$(extract_id "$response")
    echo -e "    Created with ID: $TODO_ID_3"
else
    fail "Create todo without category" "$response"
fi

print_test "Listing all todos..."
response=$(curl -s -X GET "$API_URL/todos")
if echo "$response" | grep -q '"success":true'; then
    pass "Listed todos with pagination"
else
    fail "List todos" "$response"
fi

print_test "Getting todo by ID..."
response=$(curl -s -X GET "$API_URL/todos/$TODO_ID_1")
if echo "$response" | grep -q '"success":true'; then
    pass "Retrieved todo by ID with relations"
else
    fail "Get todo by ID" "$response"
fi

print_test "Updating todo..."
response=$(curl -s -X PUT "$API_URL/todos/$TODO_ID_1" \
    -H "Content-Type: application/json" \
    -d '{"title": "Complete Q4 project report", "priority": 4}')
if echo "$response" | grep -q '"success":true'; then
    pass "Updated todo"
else
    fail "Update todo" "$response"
fi

print_test "Toggling todo completion..."
response=$(curl -s -X PATCH "$API_URL/todos/$TODO_ID_3/toggle")
if echo "$response" | grep -q '"success":true'; then
    pass "Toggled todo completion"
else
    fail "Toggle todo" "$response"
fi

print_progress

# ============================================================
# Subtask Tests
# ============================================================
print_header "5. Subtask Tests"

print_test "Adding subtask 1 to todo..."
response=$(curl -s -X POST "$API_URL/todos/$TODO_ID_1/subtasks" \
    -H "Content-Type: application/json" \
    -d '{"title": "Gather data from team"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Added subtask 1"
    SUBTASK_ID_1=$(extract_id "$response")
    echo -e "    Created with ID: $SUBTASK_ID_1"
else
    fail "Add subtask 1" "$response"
fi

print_test "Adding subtask 2 to todo..."
response=$(curl -s -X POST "$API_URL/todos/$TODO_ID_1/subtasks" \
    -H "Content-Type: application/json" \
    -d '{"title": "Create charts and graphs"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Added subtask 2"
    SUBTASK_ID_2=$(extract_id "$response")
    echo -e "    Created with ID: $SUBTASK_ID_2"
else
    fail "Add subtask 2" "$response"
fi

print_test "Adding subtask 3 to todo..."
response=$(curl -s -X POST "$API_URL/todos/$TODO_ID_1/subtasks" \
    -H "Content-Type: application/json" \
    -d '{"title": "Write executive summary"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Added subtask 3"
else
    fail "Add subtask 3" "$response"
fi

print_test "Toggling subtask completion..."
response=$(curl -s -X PATCH "$API_URL/todos/$TODO_ID_1/subtasks/$SUBTASK_ID_1/toggle")
if echo "$response" | grep -q '"success":true'; then
    pass "Toggled subtask completion"
else
    fail "Toggle subtask" "$response"
fi

print_test "Getting todo with subtasks..."
response=$(curl -s -X GET "$API_URL/todos/$TODO_ID_1")
if echo "$response" | grep -q '"subtasks"'; then
    pass "Retrieved todo with subtasks"
else
    fail "Get todo with subtasks" "$response"
fi

print_progress

# ============================================================
# Tag Association Tests
# ============================================================
print_header "6. Tag Association Tests"

print_test "Adding tag to todo..."
response=$(curl -s -X POST "$API_URL/todos/$TODO_ID_2/tags" \
    -H "Content-Type: application/json" \
    -d "{\"tagId\": $TAG_ID_3}")
if echo "$response" | grep -q '"success":true'; then
    pass "Added tag to todo"
else
    fail "Add tag to todo" "$response"
fi

print_test "Getting todo with tags..."
response=$(curl -s -X GET "$API_URL/todos/$TODO_ID_2")
if echo "$response" | grep -q '"tags"'; then
    pass "Retrieved todo with tags"
else
    fail "Get todo with tags" "$response"
fi

print_progress

# ============================================================
# Attachment Tests
# ============================================================
print_header "7. Attachment Tests"

print_test "Adding small attachment..."
response=$(curl -s -X POST "$API_URL/todos/$TODO_ID_1/attachments" \
    -H "Content-Type: application/json" \
    -d '{"filename": "notes.txt", "data": "VGhpcyBpcyBhIHRlc3QgZmlsZQ==", "mimeType": "text/plain"}')
if echo "$response" | grep -q '"success":true'; then
    pass "Added small attachment"
    ATTACHMENT_ID=$(extract_id "$response")
    echo -e "    Created with ID: $ATTACHMENT_ID"
else
    fail "Add small attachment" "$response"
fi

print_test "Getting attachment..."
response=$(curl -s -X GET "$API_URL/todos/$TODO_ID_1/attachments/$ATTACHMENT_ID")
if echo "$response" | grep -q '"success":true'; then
    pass "Retrieved attachment"
else
    fail "Get attachment" "$response"
fi

print_progress

# ============================================================
# Filtering and Pagination Tests
# ============================================================
print_header "8. Filtering and Pagination Tests"

print_test "Filtering by incomplete todos..."
response=$(curl -s -X GET "$API_URL/todos?completed=false")
if echo "$response" | grep -q '"success":true'; then
    pass "Filtered by incomplete todos"
else
    fail "Filter by incomplete" "$response"
fi

print_test "Filtering by priority 4..."
response=$(curl -s -X GET "$API_URL/todos?priority=4")
if echo "$response" | grep -q '"success":true'; then
    pass "Filtered by priority 4"
else
    fail "Filter by priority" "$response"
fi

print_test "Filtering by category..."
response=$(curl -s -X GET "$API_URL/todos?categoryId=$CATEGORY_ID_1")
if echo "$response" | grep -q '"success":true'; then
    pass "Filtered by category"
else
    fail "Filter by category" "$response"
fi

print_test "Searching todos by title..."
response=$(curl -s -X GET "$API_URL/todos?search=report")
if echo "$response" | grep -q '"success":true'; then
    pass "Searched todos by title"
else
    fail "Search todos" "$response"
fi

print_test "Paginated list (page 1, limit 2)..."
response=$(curl -s -X GET "$API_URL/todos?page=1&limit=2")
if echo "$response" | grep -q '"pagination"'; then
    pass "Paginated list retrieved"
else
    fail "Pagination" "$response"
fi

print_test "Sorting by priority descending..."
response=$(curl -s -X GET "$API_URL/todos?sortBy=priority&sortOrder=desc")
if echo "$response" | grep -q '"success":true'; then
    pass "Sorted by priority descending"
else
    fail "Sorting" "$response"
fi

print_progress

# ============================================================
# Bulk Operations Tests
# ============================================================
print_header "9. Bulk Operations Tests"

print_test "Seeding database with 50 todos..."
response=$(curl -s -X POST "$API_URL/bulk/seed" \
    -H "Content-Type: application/json" \
    -d '{"count": 50}')
if echo "$response" | grep -q '"success":true'; then
    created=$(echo "$response" | grep -o '"todosCreated":[0-9]*' | sed 's/"todosCreated"://')
    pass "Seeded database (created: $created todos)"
else
    fail "Seed database" "$response"
fi

print_test "Getting database statistics..."
response=$(curl -s -X GET "$API_URL/bulk/stats")
if echo "$response" | grep -q '"success":true'; then
    total=$(echo "$response" | grep -o '"total":[0-9]*' | head -1 | sed 's/"total"://')
    pass "Retrieved statistics (total todos: $total)"
else
    fail "Get stats" "$response"
fi

print_test "Bulk creating 5 todos..."
response=$(curl -s -X POST "$API_URL/bulk/todos" \
    -H "Content-Type: application/json" \
    -d '{"todos": [
        {"title": "Bulk todo 1", "priority": 1},
        {"title": "Bulk todo 2", "priority": 2},
        {"title": "Bulk todo 3", "priority": 3},
        {"title": "Bulk todo 4", "priority": 4},
        {"title": "Bulk todo 5", "priority": 1}
    ]}')
if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | sed 's/"count"://')
    pass "Bulk created todos (count: $count)"
else
    fail "Bulk create todos" "$response"
fi

print_test "Bulk getting todos (limit 100)..."
response=$(curl -s -X GET "$API_URL/bulk/todos?limit=100")
if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | sed 's/"count"://')
    size=$(echo "$response" | grep -o '"responseSize":"[^"]*"' | sed 's/"responseSize":"//' | sed 's/"//')
    pass "Bulk retrieved todos (count: $count, size: $size)"
else
    fail "Bulk get todos" "$response"
fi

print_progress

# ============================================================
# Large Payload Tests
# ============================================================
print_header "10. Large Payload Tests"

print_test "Getting 10KB payload..."
response=$(curl -s -X GET "$API_URL/bulk/payload/10")
if echo "$response" | grep -q '"success":true'; then
    size=$(echo "$response" | grep -o '"actualSizeBytes":[0-9]*' | sed 's/"actualSizeBytes"://')
    items=$(echo "$response" | grep -o '"itemCount":[0-9]*' | sed 's/"itemCount"://')
    pass "Retrieved 10KB payload (bytes: $size, items: $items)"
else
    fail "Get 10KB payload" "${response:0:200}"
fi

print_test "Getting 100KB payload..."
response=$(curl -s -X GET "$API_URL/bulk/payload/100")
if echo "$response" | grep -q '"success":true'; then
    size=$(echo "$response" | grep -o '"actualSizeBytes":[0-9]*' | sed 's/"actualSizeBytes"://')
    items=$(echo "$response" | grep -o '"itemCount":[0-9]*' | sed 's/"itemCount"://')
    pass "Retrieved 100KB payload (bytes: $size, items: $items)"
else
    fail "Get 100KB payload" "${response:0:200}"
fi

print_test "Getting 500KB payload..."
response=$(curl -s -X GET "$API_URL/bulk/payload/500")
if echo "$response" | grep -q '"success":true'; then
    size=$(echo "$response" | grep -o '"actualSizeBytes":[0-9]*' | sed 's/"actualSizeBytes"://')
    items=$(echo "$response" | grep -o '"itemCount":[0-9]*' | sed 's/"itemCount"://')
    pass "Retrieved 500KB payload (bytes: $size, items: $items)"
else
    fail "Get 500KB payload" "${response:0:200}"
fi

print_test "Getting 1MB payload..."
response=$(curl -s -X GET "$API_URL/bulk/payload/1000")
if echo "$response" | grep -q '"success":true'; then
    size=$(echo "$response" | grep -o '"actualSizeBytes":[0-9]*' | sed 's/"actualSizeBytes"://')
    items=$(echo "$response" | grep -o '"itemCount":[0-9]*' | sed 's/"itemCount"://')
    pass "Retrieved 1MB payload (bytes: $size, items: $items)"
else
    fail "Get 1MB payload" "${response:0:200}"
fi

print_progress

# ============================================================
# Delete Operations
# ============================================================
print_header "11. Delete Operations (Cleanup)"

print_test "Deleting attachment..."
response=$(curl -s -X DELETE "$API_URL/todos/$TODO_ID_1/attachments/$ATTACHMENT_ID")
if echo "$response" | grep -q '"success":true'; then
    pass "Deleted attachment"
else
    fail "Delete attachment" "$response"
fi

print_test "Deleting subtask..."
response=$(curl -s -X DELETE "$API_URL/todos/$TODO_ID_1/subtasks/$SUBTASK_ID_2")
if echo "$response" | grep -q '"success":true'; then
    pass "Deleted subtask"
else
    fail "Delete subtask" "$response"
fi

print_test "Removing tag from todo..."
response=$(curl -s -X DELETE "$API_URL/todos/$TODO_ID_2/tags/$TAG_ID_3")
if echo "$response" | grep -q '"success":true'; then
    pass "Removed tag from todo"
else
    fail "Remove tag from todo" "$response"
fi

print_test "Deleting todo..."
response=$(curl -s -X DELETE "$API_URL/todos/$TODO_ID_3")
if echo "$response" | grep -q '"success":true'; then
    pass "Deleted todo"
else
    fail "Delete todo" "$response"
fi

print_test "Deleting tag..."
response=$(curl -s -X DELETE "$API_URL/tags/$TAG_ID_3")
if echo "$response" | grep -q '"success":true'; then
    pass "Deleted tag"
else
    fail "Delete tag" "$response"
fi

# ============================================================
# Final Summary
# ============================================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Finished at: $(date)"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo -e "┌─────────────────────────────────────┐"
echo -e "│ Total Tests:  ${CYAN}$TOTAL_TESTS${NC}"
echo -e "│ Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "│ Failed:       ${RED}$TESTS_FAILED${NC}"
echo -e "└─────────────────────────────────────┘"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✓ ALL TESTS PASSED SUCCESSFULLY!               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ✗ SOME TESTS FAILED                         ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
