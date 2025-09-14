#!/usr/bin/env python3
"""
경북 700개 사업 웹 시스템 시작 스크립트
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def check_requirements():
    """필수 파일 및 의존성 확인"""
    print("🔍 시스템 요구사항 확인 중...")
    
    # 필수 CSV 파일 확인
    required_files = [
        '경북_관련_사업_700개_최종선별.csv',
        '경북_A급_직접관련_최종선별.csv', 
        '경북_B급_간접관련_최종선별.csv',
        '경북_C급_정책참고_최종선별.csv',
        '경북연구원_검토의견서_생성기.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ 다음 필수 파일이 없습니다:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    print("✅ 모든 필수 파일이 존재합니다.")
    
    # Python 패키지 확인
    try:
        import flask
        import pandas
        import openpyxl
        print("✅ 필수 Python 패키지가 설치되어 있습니다.")
    except ImportError as e:
        print(f"❌ 필수 패키지가 설치되지 않았습니다: {e}")
        print("다음 명령어로 설치하세요: pip install -r requirements.txt")
        return False
    
    return True

def create_directories():
    """필요한 디렉토리 생성"""
    directories = [
        'temp_reports',
        'static/css',
        'static/js', 
        'templates'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    print("✅ 필요한 디렉토리가 생성되었습니다.")

def start_server():
    """Flask 서버 시작"""
    print("\n🚀 경북 700개 사업 웹 시스템을 시작합니다...")
    print("=" * 60)
    print("📊 시스템 정보:")
    print("   - 총 700개 사업 데이터")
    print("   - A급(직접관련): 14개")
    print("   - B급(간접관련): 393개") 
    print("   - C급(정책참고): 293개")
    print("=" * 60)
    print("🌐 웹 인터페이스:")
    print("   - 노션 스타일 UI")
    print("   - 분야별 필터링 및 검색")
    print("   - 검토의견서 자동 생성")
    print("   - 엑셀 내보내기")
    print("=" * 60)
    print("🔗 접속 주소: http://localhost:5000")
    print("=" * 60)
    print("\n⏳ 서버를 시작하는 중...")
    
    # 2초 후 브라우저 자동 열기
    def open_browser():
        time.sleep(2)
        webbrowser.open('http://localhost:5000')
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Flask 앱 실행
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\n👋 서버를 종료합니다.")
    except Exception as e:
        print(f"\n❌ 서버 실행 중 오류 발생: {e}")
        print("자세한 오류 정보는 위의 로그를 확인하세요.")

def main():
    """메인 함수"""
    print("🏛️  경북연구원 700개 사업 분야별 조회 시스템")
    print("📅 2026년 국회예산안 기반 검토의견서 생성 시스템")
    print()
    
    # 요구사항 확인
    if not check_requirements():
        print("\n❌ 시스템 요구사항을 만족하지 않습니다.")
        print("필수 파일을 확인하고 다시 실행해주세요.")
        return
    
    # 디렉토리 생성
    create_directories()
    
    # 서버 시작
    start_server()

if __name__ == "__main__":
    main()
