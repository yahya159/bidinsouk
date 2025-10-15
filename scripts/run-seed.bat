@echo off
echo 🌱 Starting database seeding...
echo.

REM Run the complete seed script
npx tsx scripts/seed-complete-data.ts

echo.
echo ✅ Seeding complete!
echo.
echo You can now:
echo   1. Start the dev server: npm run dev
echo   2. Login at: http://localhost:3000/login
echo   3. Use any of the credentials shown above
pause
