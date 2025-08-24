#!/bin/bash

# 🧪 Deployment Verification Script
# Tests the learning platform deployment and Epic 7 systems

echo "🚀 Vihaan Learning Platform - Deployment Verification"
echo "=================================================="
echo ""

SITE_URL="https://yvh1223.github.io/vihaan-learning-platform"
ERROR_COUNT=0
SUCCESS_COUNT=0

# Function to test URL and report status
test_url() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ OK (HTTP $status_code)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ FAILED (HTTP $status_code)"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
}

# Test main website
echo "🌐 Testing Main Website"
echo "----------------------"
test_url "$SITE_URL" "Main page"
test_url "$SITE_URL/css/main.css" "Main CSS"
test_url "$SITE_URL/css/responsive.css" "Responsive CSS"
test_url "$SITE_URL/js/app.js" "Main JavaScript"
echo ""

# Test Epic 7 Interactive Systems
echo "🎮 Testing Epic 7 Interactive Systems"
echo "------------------------------------"
epic7_systems=(
    "drag-drop-utils.js:Drag & Drop System"
    "assessment-system.js:Assessment System"
    "multimedia-system.js:Multimedia System"
    "gamification-system.js:Gamification System"
)

for system_info in "${epic7_systems[@]}"; do
    IFS=':' read -r filename description <<< "$system_info"
    test_url "$SITE_URL/js/$filename" "$description"
done
echo ""

# Test Subject Modules
echo "🎓 Testing Subject Modules"
echo "-------------------------"
subjects=(
    "mathematics:Mathematics Module"
    "science:Science Module"
    "english:English Module"
    "social-studies:Social Studies Module"
)

for subject_info in "${subjects[@]}"; do
    IFS=':' read -r subject_name description <<< "$subject_info"
    test_url "$SITE_URL/subjects/$subject_name/index.html" "$description"
    
    # Test a sample chapter
    test_url "$SITE_URL/subjects/$subject_name/chapter-1.html" "$description Chapter 1"
done
echo ""

# Test Shared Components
echo "🔗 Testing Shared Components"
echo "---------------------------"
test_url "$SITE_URL/subjects/shared/header.html" "Shared Header"
test_url "$SITE_URL/subjects/shared/footer.html" "Shared Footer"
echo ""

# Test Assets
echo "🎨 Testing Assets"
echo "----------------"
test_url "$SITE_URL/assets/icons/logo.svg" "Logo SVG"
test_url "$SITE_URL/manifest.json" "PWA Manifest"
echo ""

# Performance Test
echo "⚡ Testing Performance"
echo "---------------------"
echo -n "Measuring response time... "
start_time=$(date +%s%N)
curl -s "$SITE_URL" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo "✅ Excellent (${response_time}ms < 1s)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ $response_time -lt 3000 ]; then
    echo "✅ Good (${response_time}ms < 3s)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "⚠️  Slow (${response_time}ms > 3s)"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Check CSS Variables
echo -n "Checking CSS Variables... "
css_content=$(curl -s "$SITE_URL/css/main.css")
if echo "$css_content" | grep -q ":root"; then
    echo "✅ Found CSS variables"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Missing CSS variables"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

# Summary Report
echo "📊 Deployment Verification Summary"
echo "================================="
echo "✅ Successful tests: $SUCCESS_COUNT"
echo "❌ Failed tests: $ERROR_COUNT"

total_tests=$((SUCCESS_COUNT + ERROR_COUNT))
if [ $total_tests -gt 0 ]; then
    success_percentage=$((SUCCESS_COUNT * 100 / total_tests))
    echo "📈 Success rate: $success_percentage%"
else
    success_percentage=0
fi

echo ""
echo "🎓 Learning Platform Status:"
echo "- Mathematics: Drag & drop place value games"
echo "- Science: Interactive STAAR-style assessments"  
echo "- English: Multimedia narration and highlighting"
echo "- Social Studies: Complete gamification dashboard"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    echo "🎉 Deployment verification PASSED!"
    echo "🌐 Live site: $SITE_URL"
    echo "🚀 Ready for student use!"
    exit 0
elif [ $success_percentage -ge 90 ]; then
    echo "⚠️  Deployment verification mostly successful ($success_percentage%)"
    echo "🔍 Check failed tests above for details"
    exit 0
else
    echo "❌ Deployment verification FAILED"
    echo "🚨 Multiple issues detected - requires attention"
    exit 1
fi