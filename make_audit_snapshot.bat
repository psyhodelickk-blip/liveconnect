@echo off
cd /d C:\Users\user\Desktop\liveconnect

REM Header
echo ===== LiveConnect AUDIT SNAPSHOT =====> audit_snapshot.txt
echo Timestamp: %date% %time%>> audit_snapshot.txt
echo.>> audit_snapshot.txt

REM Lista fajlova za snimak
for %%F in (
  "liveconnect-backend\package.json"
  "liveconnect-backend\server.js"
  "liveconnect-backend\prismaClient.js"
  "liveconnect-backend\routes\health.js"
  "liveconnect-backend\routes\db.js"
  "liveconnect-backend\routes\auth.js"
  "liveconnect-backend\utils\jwt.js"
  "liveconnect-backend\utils\password.js"
  "liveconnect-backend\middleware\requireAuth.js"
  "liveconnect-backend\prisma\schema.prisma"
  "liveconnect-frontend\package.json"
  "liveconnect-frontend\src\services\api.js"
  "liveconnect-frontend\src\AuthTest.jsx"
  "liveconnect-frontend\src\App.js"
) do (
  echo ================================>> audit_snapshot.txt
  echo %%F>> audit_snapshot.txt
  echo ------------------------------->> audit_snapshot.txt
  if exist %%F (
    type %%F>> audit_snapshot.txt
  ) else (
    echo [MISSING]>> audit_snapshot.txt
  )
  echo.>> audit_snapshot.txt
)

echo Done. Wrote audit_snapshot.txt
