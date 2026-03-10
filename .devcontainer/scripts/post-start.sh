#!/usr/bin/env bash
set -e
[ -f backend/.env.example ] && [ ! -f backend/.env ] && cp backend/.env.example backend/.env || true
[ -f frontend/.env.example ] && [ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env || true
