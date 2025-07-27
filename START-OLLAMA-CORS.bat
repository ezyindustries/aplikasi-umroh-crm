@echo off
echo Starting Ollama with CORS enabled...
echo.

REM Set environment variable for CORS
set OLLAMA_ORIGINS=*

REM Start Ollama serve
echo Running: ollama serve
echo CORS enabled for all origins (OLLAMA_ORIGINS=*)
echo.
echo Press Ctrl+C to stop Ollama
echo.

ollama serve