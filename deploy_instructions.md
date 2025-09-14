# Vercel CLI 배포 가이드

## 1. Vercel CLI 설치
```bash
npm install -g vercel
```

## 2. Vercel 로그인
```bash
vercel login
```

## 3. 프로젝트 배포
```bash
# 프로젝트 디렉토리에서 실행
vercel

# 첫 배포 시 설정 질문에 답변:
# - Set up and deploy? Y
# - Which scope? (계정 선택)
# - Link to existing project? N
# - Project name? searchdeposit6-web
# - In which directory is your code located? ./
```

## 4. 프로덕션 배포
```bash
vercel --prod
```

## 5. 배포 상태 확인
```bash
vercel ls
```
