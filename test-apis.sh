#!/bin/bash

# API Testing Script for Critical Features
# Run this after starting the Django server

BASE_URL="http://localhost:8000"

echo "🧪 Testing Critical & High Priority Features APIs"
echo "=================================================="

# Test 1: Email Templates
echo ""
echo "1️⃣  Testing Email Templates API..."
curl -s "$BASE_URL/api/contacts/email-templates/" | jq '.data | length' > /dev/null && echo "✅ Email templates API working" || echo "❌ Email templates API failed"

# Test 2: Notifications
echo ""
echo "2️⃣  Testing Notifications API..."
curl -s "$BASE_URL/api/notifications/" | jq '.unread_count' > /dev/null && echo "✅ Notifications API working" || echo "❌ Notifications API failed"

# Test 3: Notification Preferences
echo ""
echo "3️⃣  Testing Notification Preferences API..."
curl -s "$BASE_URL/api/notifications/preferences/" | jq '.in_app_task_reminders' > /dev/null && echo "✅ Notification preferences API working" || echo "❌ Notification preferences API failed"

# Test 4: Global Search
echo ""
echo "4️⃣  Testing Global Search API..."
curl -s "$BASE_URL/api/search/?q=test" | jq '.total_results' > /dev/null && echo "✅ Global search API working" || echo "❌ Global search API failed"

# Test 5: Advanced Contact Search
echo ""
echo "5️⃣  Testing Advanced Contact Search API..."
curl -s "$BASE_URL/api/contacts/search/?q=test" | jq '.total' > /dev/null && echo "✅ Advanced contact search API working" || echo "❌ Advanced contact search API failed"

# Test 6: Advanced Task Search
echo ""
echo "6️⃣  Testing Advanced Task Search API..."
curl -s "$BASE_URL/api/tasks/search/?q=test" | jq '.total' > /dev/null && echo "✅ Advanced task search API working" || echo "❌ Advanced task search API failed"

# Test 7: Contacts API (existing)
echo ""
echo "7️⃣  Testing Contacts API..."
curl -s "$BASE_URL/api/contacts/" | jq '.data | length' > /dev/null && echo "✅ Contacts API working" || echo "❌ Contacts API failed"

# Test 8: Tasks API (existing)
echo ""
echo "8️⃣  Testing Tasks API..."
curl -s "$BASE_URL/api/tasks/" | jq '.data | length' > /dev/null && echo "✅ Tasks API working" || echo "❌ Tasks API failed"

echo ""
echo "=================================================="
echo "✨ API Test Summary Complete!"
echo ""
echo "📋 To test POST endpoints:"
echo "  - Email sending: POST $BASE_URL/api/contacts/send-email/"
echo "  - Bulk operations: POST $BASE_URL/api/contacts/bulk-delete/"
echo "  - Bulk update status: POST $BASE_URL/api/contacts/bulk-update-status/"
echo "  - Import contacts: POST $BASE_URL/api/contacts/bulk-import/"
echo ""
echo "📚 See CRITICAL_FEATURES_IMPLEMENTATION.md for full API documentation"
