@echo off
rem Inicia o SmartHood AI para a feira (precisa do Node.js e da pasta out/ ja gerada).
rem O servidor abre em outra janela: para parar, feche essa janela.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 24 antes da feira: https://nodejs.org
  pause
  exit /b 1
)
if not exist "out\index.html" (
  echo A pasta out\ nao existe. Rode "npm run build" antes.
  pause
  exit /b 1
)
start "SmartHood AI - servidor" node scripts\servir.mjs 3000
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
