# 대안 배포 플랫폼 가이드

## 1. 🚀 Railway (추천)
Railway는 Python Flask 앱을 쉽게 배포할 수 있습니다.

### 설정:
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. "New Project" → "Deploy from GitHub repo"
4. 리포지토리 선택
5. 자동 배포 시작

### 필요한 파일:
- `requirements.txt` ✅ (이미 있음)
- `Procfile` (생성 필요)

## 2. 🌐 Render
무료 티어에서 Python 앱 배포 가능

### 설정:
1. https://render.com 접속
2. GitHub 연결
3. "New Web Service"
4. 리포지토리 선택
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `gunicorn app:app`

## 3. 🔥 Heroku (유료)
전통적인 PaaS 플랫폼

### 설정:
1. Heroku CLI 설치
2. `heroku create app-name`
3. `git push heroku main`

## 4. 💻 로컬 실행 (개발용)
```bash
python start_server.py
# 또는
python app.py
```
접속: http://localhost:5000
