#!/bin/bash
BASE_URL="http://localhost:3001/api"

echo "Waiting for server..."
sleep 2

echo "1. Checking Health..."
curl -s "$BASE_URL/health"
echo ""

echo "2. Creating Task..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"fromName":"Test User","description":"Test Description","category":"Home"}' "$BASE_URL/tasks")
echo "Response: $RESPONSE"
ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ID" ]; then
  echo "Failed to create task"
  exit 1
fi
echo "Created Task ID: $ID"

echo "3. Get Task..."
curl -s "$BASE_URL/tasks/$ID"
echo ""

echo "4. Listing Tasks..."
curl -s "$BASE_URL/tasks" > /dev/null && echo "List OK"

echo "5. Updating Task..."
curl -s -X PUT -H "Content-Type: application/json" -d '{"fromName":"Updated User","description":"Updated Description","category":"Home","status":"In Progress"}' "$BASE_URL/tasks/$ID"
echo ""

echo "6. Exporting CSV..."
curl -s "$BASE_URL/export" | awk 'NR==1'

echo "7. Deleting Task..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/tasks/$ID")
if [ "$STATUS" -eq 204 ]; then
  echo "Delete OK"
else
  echo "Delete Failed: $STATUS"
fi
