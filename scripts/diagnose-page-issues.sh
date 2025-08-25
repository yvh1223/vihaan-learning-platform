#!/bin/bash

# 🔍 Page Issue Diagnostic Script
# Tests specific issues that might cause pages to "not work"

echo "🔍 Diagnosing Page Issues for Social Studies Chapter 1"
echo "=================================================="
echo ""

BASE_URL="https://yvh1223.github.io/vihaan-learning-platform"
PROBLEM_PAGE="$BASE_URL/subjects/social-studies/chapter-1.html"

# Test 1: Basic connectivity
echo "1️⃣ Testing Basic Connectivity"
echo "----------------------------"
curl_result=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$PROBLEM_PAGE")
http_code=$(echo "$curl_result" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
time_total=$(echo "$curl_result" | grep -o "TIME:[0-9.]*" | cut -d: -f2)

echo "HTTP Status: $http_code"
echo "Load Time: ${time_total}s"
echo ""

# Test 2: Check for critical resources
echo "2️⃣ Testing Critical Resource Loading"
echo "-----------------------------------"
resources=(
    "$BASE_URL/css/main.css:Main CSS"
    "$BASE_URL/css/responsive.css:Responsive CSS" 
    "$BASE_URL/js/app.js:Main JavaScript"
    "$BASE_URL/subjects/shared/header.html:Shared Header"
    "$BASE_URL/subjects/shared/footer.html:Shared Footer"
)

for resource in "${resources[@]}"; do
    url=$(echo "$resource" | cut -d: -f1)
    name=$(echo "$resource" | cut -d: -f2)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        echo "✅ $name: OK"
    else
        echo "❌ $name: FAILED ($status)"
    fi
done
echo ""

# Test 3: Check for JavaScript errors in content
echo "3️⃣ Checking for Potential JavaScript Issues"
echo "------------------------------------------"
page_content=$(curl -s "$PROBLEM_PAGE")

# Check for common JavaScript issues
js_errors=0
if echo "$page_content" | grep -q "undefined"; then
    echo "⚠️  Found 'undefined' in page content"
    js_errors=$((js_errors + 1))
fi

if echo "$page_content" | grep -q "Error"; then
    echo "⚠️  Found 'Error' in page content"
    js_errors=$((js_errors + 1))
fi

if echo "$page_content" | grep -q "null"; then
    echo "⚠️  Found 'null' references in page content"
    js_errors=$((js_errors + 1))
fi

# Check for missing closing tags
open_divs=$(echo "$page_content" | grep -c "<div")
close_divs=$(echo "$page_content" | grep -c "</div>")
if [ "$open_divs" -ne "$close_divs" ]; then
    echo "⚠️  Unbalanced div tags: $open_divs opening, $close_divs closing"
    js_errors=$((js_errors + 1))
fi

if [ "$js_errors" -eq 0 ]; then
    echo "✅ No obvious JavaScript issues found"
else
    echo "❌ Found $js_errors potential JavaScript issues"
fi
echo ""

# Test 4: Check content size and structure
echo "4️⃣ Analyzing Page Content Structure"
echo "---------------------------------"
content_size=$(echo "$page_content" | wc -c)
echo "Page size: $content_size bytes"

# Check for key elements
if echo "$page_content" | grep -q "timelineExplorer"; then
    echo "✅ Timeline Explorer section found"
else
    echo "❌ Timeline Explorer section missing"
fi

if echo "$page_content" | grep -q "colonialLife"; then
    echo "✅ Colonial Life section found" 
else
    echo "❌ Colonial Life section missing"
fi

if echo "$page_content" | grep -q "revolutionCenter"; then
    echo "✅ Revolution Center section found"
else
    echo "❌ Revolution Center section missing"
fi

if echo "$page_content" | grep -q "foundingFathers"; then
    echo "✅ Founding Fathers section found"
else
    echo "❌ Founding Fathers section missing"
fi
echo ""

# Test 5: Compare with working page
echo "5️⃣ Comparing with Working Page"
echo "-----------------------------"
working_page="$BASE_URL/subjects/mathematics/chapter-1.html"
working_status=$(curl -s -o /dev/null -w "%{http_code}" "$working_page")
working_size=$(curl -s "$working_page" | wc -c)

echo "Social Studies Chapter 1: $http_code ($content_size bytes)"
echo "Mathematics Chapter 1: $working_status ($working_size bytes)"

if [ "$http_code" = "$working_status" ]; then
    echo "✅ Both pages have same HTTP status"
else
    echo "❌ Different HTTP status codes"
fi
echo ""

# Test 6: Mobile/responsive test simulation
echo "6️⃣ Testing Mobile Compatibility"
echo "------------------------------"
mobile_test=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)" "$PROBLEM_PAGE" | wc -c)
desktop_test=$(curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "$PROBLEM_PAGE" | wc -c)

echo "Mobile view: $mobile_test bytes"
echo "Desktop view: $desktop_test bytes"

if [ "$mobile_test" -eq "$desktop_test" ]; then
    echo "✅ Consistent content across devices"
else
    echo "⚠️  Different content sizes - possible responsive issues"
fi
echo ""

# Test 7: Check for external dependencies
echo "7️⃣ Checking External Dependencies"  
echo "--------------------------------"
external_deps=0
if echo "$page_content" | grep -q "googleapis.com"; then
    echo "⚠️  Google Fonts dependency detected"
    external_deps=$((external_deps + 1))
fi

if echo "$page_content" | grep -q "cdnjs.cloudflare.com"; then
    echo "⚠️  CDN dependency detected"
    external_deps=$((external_deps + 1))
fi

if echo "$page_content" | grep -q "ajax.googleapis.com"; then
    echo "⚠️  Google AJAX dependency detected" 
    external_deps=$((external_deps + 1))
fi

if [ "$external_deps" -eq 0 ]; then
    echo "✅ No external dependencies found"
else
    echo "❌ Found $external_deps external dependencies that could cause issues"
fi
echo ""

# Final diagnosis
echo "📋 DIAGNOSIS SUMMARY"
echo "==================="
echo "Page URL: $PROBLEM_PAGE"
echo "Status: $http_code"
echo "Load Time: ${time_total}s"
echo "Content Size: $content_size bytes"

if [ "$http_code" = "200" ] && [ "$js_errors" -eq 0 ] && [ "$external_deps" -eq 0 ]; then
    echo "✅ DIAGNOSIS: Page appears to be working correctly"
    echo "   The issue might be browser-specific, JavaScript execution, or user-specific."
else
    echo "⚠️  DIAGNOSIS: Potential issues detected"
    echo "   Recommended: Check browser developer console for specific errors"
fi