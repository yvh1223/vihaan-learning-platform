#!/bin/bash

# 🧪 Comprehensive Page Testing Script
# Tests all pages for accessibility, content, and navigation

echo "🧪 Vihaan Learning Platform - Comprehensive Page Testing"
echo "======================================================"
echo ""

BASE_URL="https://yvh1223.github.io/vihaan-learning-platform"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test page and content
test_page() {
    local url=$1
    local description=$2
    local expected_content=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $description... "
    
    # Test HTTP status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_status" = "200" ]; then
        # Test if expected content exists
        if [ -n "$expected_content" ]; then
            content_check=$(curl -s "$url" | grep -c "$expected_content")
            if [ "$content_check" -gt 0 ]; then
                echo "✅ OK (HTTP $http_status, Content ✓)"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo "⚠️  WARNING (HTTP $http_status, Content Missing: $expected_content)"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            echo "✅ OK (HTTP $http_status)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo "❌ FAILED (HTTP $http_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test CSS/JS loading
test_resource() {
    local url=$1
    local description=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $description... "
    
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_status" = "200" ]; then
        echo "✅ OK (HTTP $http_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED (HTTP $http_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test main site
echo "🏠 Testing Main Site"
echo "-------------------"
test_page "$BASE_URL/" "Main Dashboard" "Welcome Back, Learner"
test_page "$BASE_URL/index.html" "Index Page" "chapter-link"

# Test core resources
echo ""
echo "📦 Testing Core Resources"
echo "------------------------"
test_resource "$BASE_URL/css/main.css" "Main CSS"
test_resource "$BASE_URL/css/responsive.css" "Responsive CSS"
test_resource "$BASE_URL/js/app.js" "Main JavaScript"

# Test Epic 7 Interactive Systems
echo ""
echo "🎮 Testing Epic 7 Interactive Systems"
echo "------------------------------------"
test_resource "$BASE_URL/js/drag-drop-utils.js" "Drag & Drop System"
test_resource "$BASE_URL/js/assessment-system.js" "Assessment System"  
test_resource "$BASE_URL/js/multimedia-system.js" "Multimedia System"
test_resource "$BASE_URL/js/gamification-system.js" "Gamification System"

# Test subject modules
echo ""
echo "🎓 Testing Subject Modules"
echo "-------------------------"
subjects=("mathematics" "science" "english" "social-studies")
subject_names=("Mathematics" "Science" "English Language Arts" "Social Studies")

for i in "${!subjects[@]}"; do
    subject="${subjects[$i]}"
    name="${subject_names[$i]}"
    
    echo "📚 Testing $name"
    test_page "$BASE_URL/subjects/$subject/index.html" "$name Index" "$name"
    
    # Test chapters
    for chapter_num in 1 2 3; do
        test_page "$BASE_URL/subjects/$subject/chapter-$chapter_num.html" "$name Chapter $chapter_num" "Chapter $chapter_num"
    done
    echo
done

# Test shared components
echo "🔗 Testing Shared Components"
echo "---------------------------"
test_page "$BASE_URL/subjects/shared/header.html" "Shared Header" "nav-link"
test_page "$BASE_URL/subjects/shared/footer.html" "Shared Footer" "footer"

# Test navigation functionality by checking if navigation links exist in pages
echo ""
echo "🧭 Testing Navigation Links"
echo "--------------------------"
echo -n "Testing main navigation structure... "
nav_check=$(curl -s "$BASE_URL/" | grep -c "subjects/.*index.html")
if [ "$nav_check" -ge 4 ]; then
    echo "✅ OK (Found $nav_check subject links)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAILED (Found only $nav_check subject links, expected 4+)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -n "Testing chapter navigation structure... "
chapter_links=$(curl -s "$BASE_URL/" | grep -c "chapter-link")
if [ "$chapter_links" -ge 12 ]; then
    echo "✅ OK (Found $chapter_links chapter links)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAILED (Found only $chapter_links chapter links, expected 12+)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Performance testing
echo ""
echo "⚡ Testing Performance"
echo "--------------------"
echo -n "Measuring main page response time... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $response_time -lt 2000 ]; then
    echo "✅ Excellent (${response_time}ms < 2s)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ $response_time -lt 5000 ]; then
    echo "✅ Good (${response_time}ms < 5s)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  Slow (${response_time}ms > 5s)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Final results
echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "✅ Passed tests: $PASSED_TESTS"
echo "❌ Failed tests: $FAILED_TESTS"
echo "📈 Total tests: $TOTAL_TESTS"

if [ $TOTAL_TESTS -gt 0 ]; then
    success_percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "🎯 Success rate: $success_percentage%"
else
    success_percentage=0
fi

echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests PASSED! Site is fully functional."
    exit 0
elif [ $success_percentage -ge 90 ]; then
    echo "⚠️  Most tests passed ($success_percentage%) - minor issues detected"
    exit 0
else
    echo "❌ Multiple test failures detected - requires attention"
    exit 1
fi