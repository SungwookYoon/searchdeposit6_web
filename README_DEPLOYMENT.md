# 🚀 Vercel 배포 가이드

## 📋 배포 준비 사항

### 1. GitHub Repository 설정
```bash
# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: 경북 700개 사업 분야별 조회 시스템 완성"

# GitHub 리포지토리에 푸시
git remote add origin [YOUR_GITHUB_REPO_URL]
git branch -M main
git push -u origin main
```

### 2. Vercel 배포 설정

#### 필수 파일들 ✅
- `vercel.json` - Vercel 배포 설정
- `requirements.txt` - Python 의존성
- `runtime.txt` - Python 버전 지정
- `.gitignore` - Git 제외 파일 설정

#### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수 설정:
```
PYTHONPATH=.
```

### 3. 배포 과정

1. **Vercel 계정 연결**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 임포트**
   - "New Project" 클릭
   - GitHub 리포지토리 선택
   - "Import" 클릭

3. **배포 설정**
   - Framework Preset: `Other`
   - Build Command: (비워둠)
   - Output Directory: (비워둠)
   - Install Command: `pip install -r requirements.txt`

4. **배포 실행**
   - "Deploy" 버튼 클릭
   - 자동 빌드 및 배포 진행

## 🔧 Vercel 환경 최적화

### 파일 시스템 제약
- Vercel에서는 `/tmp` 디렉토리만 쓰기 가능
- 생성된 파일은 임시적으로만 유지됨
- 대용량 파일 처리 시 메모리 제한 고려

### 성능 최적화
- 함수 실행 시간: 최대 60초 (Hobby 플랜)
- 메모리 제한: 1024MB
- 콜드 스타트 최적화를 위한 의존성 최소화

## 📊 주요 기능별 배포 고려사항

### 1. CSV 데이터 로딩
- ✅ 정적 파일로 포함되어 자동 배포
- ✅ 빠른 로딩을 위한 pandas 최적화

### 2. 검토의견서 생성
- ✅ `/tmp` 디렉토리 사용으로 Vercel 호환
- ⚠️ 생성된 파일은 임시적 (세션 종료 시 삭제)
- ✅ 실시간 다운로드 지원

### 3. 엑셀 내보내기
- ✅ 메모리 기반 처리로 Vercel 호환
- ✅ 즉시 다운로드 방식

### 4. 정적 파일 서빙
- ✅ CSS, JavaScript 자동 서빙
- ✅ CDN을 통한 빠른 로딩

## 🌐 배포 후 확인사항

### 필수 테스트
1. **메인 페이지 로딩**
   - 통계 카드 정상 표시
   - 필터 옵션 로딩

2. **데이터 조회**
   - 프로젝트 목록 표시
   - 필터링 기능 동작
   - 페이징 기능 동작

3. **상세 정보**
   - 프로젝트 상세 모달 열기
   - 모든 정보 정상 표시

4. **검토의견서 생성**
   - 프로젝트 선택 후 생성
   - 파일 다운로드 테스트

5. **엑셀 내보내기**
   - 필터링된 데이터 내보내기
   - 파일 다운로드 확인

## 🚨 문제 해결

### 일반적인 배포 오류

#### 1. Build 실패
```bash
# 로컬에서 의존성 확인
pip install -r requirements.txt
python app.py
```

#### 2. 모듈 임포트 오류
- `PYTHONPATH=.` 환경 변수 확인
- `vercel.json`의 env 설정 확인

#### 3. 파일 경로 오류
- `/tmp` 디렉토리 사용 확인
- 상대 경로 vs 절대 경로 확인

#### 4. 메모리 초과
- 대용량 데이터 처리 시 배치 처리 적용
- 불필요한 의존성 제거

### 성능 최적화

#### 1. 콜드 스타트 개선
- 필수 라이브러리만 import
- 지연 로딩 적용

#### 2. 메모리 사용량 최적화
- DataFrame 메모리 사용량 모니터링
- 불필요한 데이터 정리

## 📈 모니터링

### Vercel 대시보드
- 함수 실행 시간 모니터링
- 에러 로그 확인
- 트래픽 분석

### 성능 메트릭
- 페이지 로딩 시간
- API 응답 시간
- 메모리 사용량

## 🔄 업데이트 배포

### 자동 배포
```bash
# 코드 수정 후
git add .
git commit -m "업데이트 내용"
git push origin main
# Vercel에서 자동 재배포
```

### 수동 배포
- Vercel 대시보드에서 "Redeploy" 클릭

## 📞 지원 및 문의

### 배포 관련 문제
- Vercel 공식 문서: https://vercel.com/docs
- GitHub Issues를 통한 문제 리포팅

### 시스템 관련 문의
- 경북연구원 예산안 검토 TF
- 기술 지원: 시스템 관리자

---

**🎯 배포 성공 후 예상 URL**: `https://your-project-name.vercel.app`

**📊 예상 성능**:
- 초기 로딩: 2-3초
- 데이터 조회: 1-2초
- 검토의견서 생성: 10-30초 (프로젝트 수에 따라)

**💡 팁**: 첫 배포 후 몇 분간 기다린 후 테스트하여 모든 기능이 정상 작동하는지 확인하세요!
