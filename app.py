"""
경북 700개 사업 분야별 조회 웹 애플리케이션
- Flask 기반 웹 서버
- 노션 스타일 UI
- 분야별 필터링 및 검색
- PDF 검토의견서 생성
"""

from flask import Flask, render_template, jsonify, request, send_file
import pandas as pd
import json
import os
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import subprocess
import sys

app = Flask(__name__)

class GyeongbukProjectManager:
    def __init__(self):
        """경북 사업 관리자 초기화"""
        self.load_data()
        self.setup_filters()
    
    def load_data(self):
        """CSV 데이터 로드"""
        try:
            # 전체 700개 사업 데이터
            self.df_all = pd.read_csv('경북_관련_사업_700개_최종선별.csv')
            
            # 등급별 데이터
            self.df_a = pd.read_csv('경북_A급_직접관련_최종선별.csv')
            self.df_b = pd.read_csv('경북_B급_간접관련_최종선별.csv') 
            self.df_c = pd.read_csv('경북_C급_정책참고_최종선별.csv')
            
            print(f"데이터 로드 완료: 전체 {len(self.df_all)}개 사업")
            print(f"- A급: {len(self.df_a)}개")
            print(f"- B급: {len(self.df_b)}개") 
            print(f"- C급: {len(self.df_c)}개")
            
        except Exception as e:
            print(f"데이터 로드 오류: {e}")
            # 빈 DataFrame 생성
            self.df_all = pd.DataFrame()
            self.df_a = pd.DataFrame()
            self.df_b = pd.DataFrame()
            self.df_c = pd.DataFrame()
    
    def setup_filters(self):
        """필터 옵션 설정"""
        if not self.df_all.empty:
            self.filter_options = {
                'departments': sorted(self.df_all['주요부처'].dropna().unique().tolist()),
                'grades': sorted(self.df_all['경북관련성_최종'].dropna().unique().tolist()),
                'types': sorted(self.df_all['사업유형'].dropna().unique().tolist()),
                'regions': sorted(self.df_all['지역관련성'].dropna().unique().tolist())
            }
        else:
            self.filter_options = {
                'departments': [],
                'grades': [],
                'types': [],
                'regions': []
            }
    
    def get_statistics(self):
        """통계 정보 반환"""
        if self.df_all.empty:
            return {
                'total_projects': 0,
                'a_grade_count': 0,
                'b_grade_count': 0,
                'c_grade_count': 0,
                'avg_score': 0
            }
        
        return {
            'total_projects': len(self.df_all),
            'a_grade_count': len(self.df_a),
            'b_grade_count': len(self.df_b),
            'c_grade_count': len(self.df_c),
            'avg_score': round(self.df_all['경북관련도점수'].mean(), 1) if '경북관련도점수' in self.df_all.columns else 0
        }
    
    def filter_projects(self, filters):
        """프로젝트 필터링"""
        df = self.df_all.copy()
        
        if filters.get('department'):
            df = df[df['주요부처'] == filters['department']]
        
        if filters.get('grade'):
            df = df[df['경북관련성_최종'] == filters['grade']]
        
        if filters.get('type'):
            df = df[df['사업유형'] == filters['type']]
        
        if filters.get('region'):
            df = df[df['지역관련성'] == filters['region']]
        
        if filters.get('search'):
            search_term = filters['search'].lower()
            df = df[
                df['단위사업명'].str.lower().str.contains(search_term, na=False) |
                df['사업내용'].str.lower().str.contains(search_term, na=False)
            ]
        
        if filters.get('min_score') is not None and filters.get('max_score') is not None:
            df = df[
                (df['경북관련도점수'] >= filters['min_score']) &
                (df['경북관련도점수'] <= filters['max_score'])
            ]
        
        return df
    
    def get_project_detail(self, index):
        """프로젝트 상세 정보 반환"""
        try:
            # 인덱스 유효성 검사
            if index < 0 or index >= len(self.df_all):
                print(f"잘못된 인덱스: {index}, 전체 데이터 수: {len(self.df_all)}")
                return None
            
            project = self.df_all.iloc[index]
            return {
                'index': index,
                'name': str(project.get('단위사업명', '')),
                'department': str(project.get('주요부처', '')),
                'content': str(project.get('사업내용', '')),
                'budget': str(project.get('사업비', '')),
                'grade': str(project.get('경북관련성_최종', '')),
                'type': str(project.get('사업유형', '')),
                'region': str(project.get('지역관련성', '')),
                'score': float(project.get('경북관련도점수', 0)) if project.get('경북관련도점수') else 0,
                'period': str(project.get('사업기간', '')),
                'agency': str(project.get('시행주체', '')),
                'matching': str(project.get('지방비매칭여부', '')),
                'source': str(project.get('출처파일', ''))
            }
        except Exception as e:
            print(f"프로젝트 상세 정보 조회 오류 (index: {index}): {e}")
            import traceback
            traceback.print_exc()
            return None

# 전역 매니저 인스턴스
project_manager = GyeongbukProjectManager()

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/api/statistics')
def get_statistics():
    """통계 정보 API"""
    return jsonify(project_manager.get_statistics())

@app.route('/api/filters')
def get_filters():
    """필터 옵션 API"""
    return jsonify(project_manager.filter_options)

@app.route('/api/projects')
def get_projects():
    """프로젝트 목록 API"""
    filters = {
        'department': request.args.get('department'),
        'grade': request.args.get('grade'),
        'type': request.args.get('type'),
        'region': request.args.get('region'),
        'search': request.args.get('search'),
        'min_score': request.args.get('min_score', type=int),
        'max_score': request.args.get('max_score', type=int)
    }
    
    # None 값 제거
    filters = {k: v for k, v in filters.items() if v is not None and v != ''}
    
    df_filtered = project_manager.filter_projects(filters)
    
    # 페이징
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    projects = []
    for i, (idx, row) in enumerate(df_filtered.iloc[start_idx:end_idx].iterrows()):
        projects.append({
            'index': idx,  # DataFrame의 실제 인덱스 사용
            'display_index': start_idx + i + 1,  # 화면 표시용 순번
            'name': str(row.get('단위사업명', '')),
            'department': str(row.get('주요부처', '')),
            'content': str(row.get('사업내용', ''))[:100] + '...' if len(str(row.get('사업내용', ''))) > 100 else str(row.get('사업내용', '')),
            'budget': str(row.get('사업비', '')),
            'grade': str(row.get('경북관련성_최종', '')),
            'score': float(row.get('경북관련도점수', 0)) if row.get('경북관련도점수') else 0,
            'type': str(row.get('사업유형', '')),
            'region': str(row.get('지역관련성', ''))
        })
    
    return jsonify({
        'projects': projects,
        'total': len(df_filtered),
        'page': page,
        'per_page': per_page,
        'total_pages': (len(df_filtered) + per_page - 1) // per_page
    })

@app.route('/api/project/<int:index>')
def get_project_detail(index):
    """프로젝트 상세 정보 API"""
    detail = project_manager.get_project_detail(index)
    if detail:
        return jsonify(detail)
    else:
        return jsonify({'error': '프로젝트를 찾을 수 없습니다.'}), 404

@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    """검토의견서 PDF 생성 API"""
    try:
        data = request.get_json()
        selected_projects = data.get('projects', [])
        
        if not selected_projects:
            return jsonify({'error': '선택된 프로젝트가 없습니다.'}), 400
        
        # Python 검토의견서 생성기 실행
        import sys
        sys.path.append('.')
        from 경북연구원_검토의견서_생성기 import GyeongbukResearchInstituteReportGenerator
        
        generator = GyeongbukResearchInstituteReportGenerator()
        
        # 선택된 프로젝트들에 대해 검토의견서 생성
        generated_files = []
        for project_index in selected_projects:
            try:
                row = project_manager.df_all.iloc[project_index]
                priority = generator.calculate_priority_percentage(row)
                main_keyword = generator.extract_keywords(row['단위사업명'])
                report_content = generator.generate_comprehensive_report(row, priority)
                filename = generator.generate_filename(row, priority, main_keyword)
                
                 # 임시 파일로 저장 (Vercel에서는 /tmp 사용)
                 temp_dir = '/tmp/temp_reports' if os.path.exists('/tmp') else 'temp_reports'
                 temp_path = os.path.join(temp_dir, filename)
                 os.makedirs(temp_dir, exist_ok=True)
                
                with open(temp_path, 'w', encoding='utf-8') as f:
                    f.write(report_content)
                
                generated_files.append({
                    'filename': filename,
                    'path': temp_path,
                    'project_name': row.get('단위사업명', ''),
                    'priority': priority
                })
                
            except Exception as e:
                print(f"프로젝트 {project_index} 검토의견서 생성 오류: {e}")
                continue
        
        return jsonify({
            'success': True,
            'generated_count': len(generated_files),
            'files': generated_files
        })
        
    except Exception as e:
        print(f"검토의견서 생성 오류: {e}")
        return jsonify({'error': f'검토의견서 생성 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/download_report/<filename>')
def download_report(filename):
    """검토의견서 파일 다운로드"""
     try:
         # Vercel 환경에 맞는 경로 설정
         temp_dir = '/tmp/temp_reports' if os.path.exists('/tmp') else 'temp_reports'
         file_path = os.path.join(temp_dir, filename)
         
         if os.path.exists(file_path):
             return send_file(file_path, as_attachment=True, download_name=filename)
         else:
             return "파일을 찾을 수 없습니다.", 404
    except Exception as e:
        return f"다운로드 오류: {str(e)}", 500

@app.route('/api/export_excel', methods=['POST'])
def export_excel():
    """엑셀 내보내기 API"""
    try:
        data = request.get_json()
        filters = data.get('filters', {})
        
        df_filtered = project_manager.filter_projects(filters)
        
        # 엑셀 파일 생성
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # 주요 컬럼만 선택
            export_columns = [
                '단위사업명', '주요부처', '사업내용', '사업비', 
                '경북관련성_최종', '경북관련도점수', '사업유형', 
                '지역관련성', '사업기간', '시행주체'
            ]
            
            # 존재하는 컬럼만 선택
            available_columns = [col for col in export_columns if col in df_filtered.columns]
            df_export = df_filtered[available_columns]
            
            df_export.to_excel(writer, sheet_name='경북관련사업', index=False)
        
        output.seek(0)
        
        # 파일명 생성
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'경북관련사업_{timestamp}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"엑셀 내보내기 오류: {e}")
        return jsonify({'error': f'엑셀 내보내기 중 오류가 발생했습니다: {str(e)}'}), 500

# 필요한 디렉토리 생성 (Vercel에서는 /tmp 사용)
def ensure_directories():
    try:
        os.makedirs('/tmp/temp_reports', exist_ok=True)
        os.makedirs('static/css', exist_ok=True)
        os.makedirs('static/js', exist_ok=True)
        os.makedirs('templates', exist_ok=True)
    except:
        # Vercel 환경에서는 일부 디렉토리 생성이 제한될 수 있음
        pass

ensure_directories()

if __name__ == '__main__':
    print("=== 경북 700개 사업 웹 시스템 시작 ===")
    print("- 노션 스타일 UI")
    print("- 분야별 필터링 및 검색")
    print("- PDF 검토의견서 생성")
    print("- 엑셀 내보내기")
    print("- 접속 주소: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
