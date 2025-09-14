/**
 * 경북 700개 사업 대시보드 JavaScript
 * - 노션 스타일 UI 인터랙션
 * - 데이터 로딩 및 필터링
 * - 검토의견서 생성
 */

class GyeongbukDashboard {
    constructor() {
        this.selectedProjects = new Set();
        this.currentPage = 1;
        this.currentFilters = {};
        this.projects = [];
        this.totalProjects = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.updateCurrentDate();
    }
    
    setupEventListeners() {
        // 필터 이벤트
        document.getElementById('dept-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('grade-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('type-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('region-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('search-input').addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        
        // 점수 범위 슬라이더
        document.getElementById('min-score').addEventListener('input', (e) => {
            document.getElementById('min-score-label').textContent = e.target.value;
            this.applyFilters();
        });
        document.getElementById('max-score').addEventListener('input', (e) => {
            document.getElementById('max-score-label').textContent = e.target.value;
            this.applyFilters();
        });
        
        // 필터 초기화
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        
        // 전체 선택 체크박스
        document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
        
        // 선택 관리 버튼
        document.getElementById('generate-reports-btn').addEventListener('click', () => this.generateReports());
        document.getElementById('clear-selection-btn').addEventListener('click', () => this.clearSelection());
        
        // 엑셀 다운로드
        document.getElementById('export-btn').addEventListener('click', () => this.exportExcel());
        
        // 모달 이벤트
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal('detail-modal'));
        document.getElementById('report-modal-close').addEventListener('click', () => this.closeModal('report-modal'));
        
        // 모달 외부 클릭 시 닫기
        document.getElementById('detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'detail-modal') this.closeModal('detail-modal');
        });
        document.getElementById('report-modal').addEventListener('click', (e) => {
            if (e.target.id === 'report-modal') this.closeModal('report-modal');
        });
    }
    
    async loadInitialData() {
        try {
            console.log('초기 데이터 로드 시작...');
            
            // 통계 정보 로드
            await this.loadStatistics();
            
            // 필터 옵션 로드
            await this.loadFilterOptions();
            
            // 프로젝트 목록 로드
            await this.loadProjects();
            
            console.log('초기 데이터 로드 완료');
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
            this.showToast('데이터 로드 중 오류가 발생했습니다. 페이지를 새로고침해보세요.', 'error');
        }
    }
    
    async loadStatistics() {
        try {
            console.log('통계 정보 로드 시작...');
            const response = await fetch('/api/statistics');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const stats = await response.json();
            console.log('통계 데이터:', stats);
            
            document.getElementById('total-projects').textContent = stats.total_projects.toLocaleString();
            document.getElementById('a-grade-count').textContent = stats.a_grade_count.toLocaleString();
            document.getElementById('b-grade-count').textContent = stats.b_grade_count.toLocaleString();
            document.getElementById('avg-score').textContent = stats.avg_score;
            
            console.log('통계 정보 로드 완료');
        } catch (error) {
            console.error('통계 로드 오류:', error);
            this.showToast('통계 정보를 불러오는 중 오류가 발생했습니다.', 'error');
            
            // 기본값 설정
            document.getElementById('total-projects').textContent = '0';
            document.getElementById('a-grade-count').textContent = '0';
            document.getElementById('b-grade-count').textContent = '0';
            document.getElementById('avg-score').textContent = '0';
        }
    }
    
    async loadFilterOptions() {
        try {
            console.log('필터 옵션 로드 시작...');
            const response = await fetch('/api/filters');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const filters = await response.json();
            console.log('필터 옵션:', filters);
            
            this.populateSelect('dept-filter', filters.departments || []);
            this.populateSelect('grade-filter', filters.grades || []);
            this.populateSelect('type-filter', filters.types || []);
            this.populateSelect('region-filter', filters.regions || []);
            
            console.log('필터 옵션 로드 완료');
        } catch (error) {
            console.error('필터 옵션 로드 오류:', error);
            this.showToast('필터 옵션을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }
    
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        // 기존 옵션 제거 (첫 번째 "전체" 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // 새 옵션 추가
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // 이전 값 복원
        if (currentValue && options.includes(currentValue)) {
            select.value = currentValue;
        }
    }
    
    async loadProjects(page = 1) {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: 50,
                ...this.currentFilters
            });
            
            const response = await fetch(`/api/projects?${params}`);
            const data = await response.json();
            
            this.projects = data.projects;
            this.totalProjects = data.total;
            this.currentPage = page;
            
            this.renderProjects();
            this.renderPagination(data.total_pages);
            this.updateResultsCount();
            
            // 빈 상태 처리
            if (data.projects.length === 0) {
                this.showEmptyState(true);
            } else {
                this.showEmptyState(false);
            }
            
        } catch (error) {
            console.error('프로젝트 로드 오류:', error);
            this.showToast('프로젝트 목록을 불러오는 중 오류가 발생했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderProjects() {
        const tbody = document.getElementById('data-tbody');
        tbody.innerHTML = '';
        
        this.projects.forEach((project, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="project-checkbox" 
                           data-index="${project.index}" 
                           ${this.selectedProjects.has(project.index) ? 'checked' : ''}>
                </td>
                <td>${project.display_index || ((this.currentPage - 1) * 50 + index + 1)}</td>
                <td>${this.escapeHtml(project.department)}</td>
                <td>
                    <div class="project-name" style="font-weight: 600; margin-bottom: 0.25rem;">${this.escapeHtml(project.name)}</div>
                    <div class="project-content" style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHtml(project.content)}</div>
                </td>
                <td>${this.formatBudget(project.budget)}</td>
                <td><span class="grade-badge ${this.getGradeClass(project.grade)}">${project.grade}</span></td>
                <td><span class="${this.getScoreClass(project.score)}">${project.score}</span></td>
                <td>${this.escapeHtml(project.type)}</td>
                <td>${this.escapeHtml(project.region)}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.5rem; font-size: 0.75rem;" onclick="dashboard.showProjectDetail(${project.index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // 체크박스 이벤트 리스너 추가
        document.querySelectorAll('.project-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    this.selectedProjects.add(index);
                } else {
                    this.selectedProjects.delete(index);
                }
                this.updateSelectionUI();
            });
        });
    }
    
    renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // 이전 버튼
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.loadProjects(this.currentPage - 1);
            }
        });
        pagination.appendChild(prevBtn);
        
        // 페이지 번호 버튼
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.addEventListener('click', () => this.loadProjects(1));
            pagination.appendChild(firstBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem';
                pagination.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === this.currentPage);
            pageBtn.addEventListener('click', () => this.loadProjects(i));
            pagination.appendChild(pageBtn);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem';
                pagination.appendChild(ellipsis);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.textContent = totalPages;
            lastBtn.addEventListener('click', () => this.loadProjects(totalPages));
            pagination.appendChild(lastBtn);
        }
        
        // 다음 버튼
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.loadProjects(this.currentPage + 1);
            }
        });
        pagination.appendChild(nextBtn);
    }
    
    applyFilters() {
        this.currentFilters = {
            department: document.getElementById('dept-filter').value,
            grade: document.getElementById('grade-filter').value,
            type: document.getElementById('type-filter').value,
            region: document.getElementById('region-filter').value,
            search: document.getElementById('search-input').value,
            min_score: document.getElementById('min-score').value,
            max_score: document.getElementById('max-score').value
        };
        
        // 빈 값 제거
        Object.keys(this.currentFilters).forEach(key => {
            if (!this.currentFilters[key]) {
                delete this.currentFilters[key];
            }
        });
        
        this.loadProjects(1);
    }
    
    resetFilters() {
        document.getElementById('dept-filter').value = '';
        document.getElementById('grade-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('region-filter').value = '';
        document.getElementById('search-input').value = '';
        document.getElementById('min-score').value = '0';
        document.getElementById('max-score').value = '300';
        document.getElementById('min-score-label').textContent = '0';
        document.getElementById('max-score-label').textContent = '300';
        
        this.currentFilters = {};
        this.loadProjects(1);
    }
    
    toggleSelectAll(checked) {
        if (checked) {
            this.projects.forEach(project => {
                this.selectedProjects.add(project.index);
            });
        } else {
            this.projects.forEach(project => {
                this.selectedProjects.delete(project.index);
            });
        }
        
        // 체크박스 상태 업데이트
        document.querySelectorAll('.project-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        this.updateSelectionUI();
    }
    
    updateSelectionUI() {
        const count = this.selectedProjects.size;
        document.getElementById('selected-count').textContent = `${count}개 선택됨`;
        document.getElementById('generate-reports-btn').disabled = count === 0;
        
        // 선택된 프로젝트 목록 표시
        const container = document.getElementById('selected-list-container');
        const list = document.getElementById('selected-list');
        
        if (count > 0) {
            container.style.display = 'block';
            list.innerHTML = '';
            
            // 현재 페이지의 선택된 프로젝트만 표시 (성능 최적화)
            const selectedInCurrentPage = this.projects.filter(p => this.selectedProjects.has(p.index));
            selectedInCurrentPage.forEach(project => {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `
                    <span>${this.escapeHtml(project.name)}</span>
                    <button class="remove-btn" onclick="dashboard.removeFromSelection(${project.index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                list.appendChild(item);
            });
            
            // 더 많은 선택이 있다면 표시
            if (count > selectedInCurrentPage.length) {
                const moreItem = document.createElement('div');
                moreItem.className = 'selected-item';
                moreItem.style.fontStyle = 'italic';
                moreItem.innerHTML = `<span>... 외 ${count - selectedInCurrentPage.length}개 더</span>`;
                list.appendChild(moreItem);
            }
        } else {
            container.style.display = 'none';
        }
        
        // 전체 선택 체크박스 상태 업데이트
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const visibleProjects = this.projects.length;
        const selectedVisibleProjects = this.projects.filter(p => this.selectedProjects.has(p.index)).length;
        
        if (selectedVisibleProjects === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedVisibleProjects === visibleProjects) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
    
    removeFromSelection(index) {
        this.selectedProjects.delete(index);
        
        // 해당 체크박스 해제
        const checkbox = document.querySelector(`input[data-index="${index}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        this.updateSelectionUI();
    }
    
    clearSelection() {
        this.selectedProjects.clear();
        
        // 모든 체크박스 해제
        document.querySelectorAll('.project-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.getElementById('select-all-checkbox').checked = false;
        
        this.updateSelectionUI();
    }
    
    async showProjectDetail(index) {
        try {
            console.log(`프로젝트 상세 정보 요청: 인덱스 ${index}`);
            const response = await fetch(`/api/project/${index}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const project = await response.json();
            console.log('프로젝트 상세 정보:', project);
            
            if (project.error) {
                this.showToast(project.error, 'error');
                return;
            }
            
            document.getElementById('modal-title').textContent = project.name;
            document.getElementById('modal-body').innerHTML = `
                <div class="project-detail">
                    <div class="detail-group">
                        <div class="detail-label">사업명</div>
                        <div class="detail-value">${this.escapeHtml(project.name)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">주요부처</div>
                        <div class="detail-value">${this.escapeHtml(project.department)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">사업비</div>
                        <div class="detail-value">${this.formatBudget(project.budget)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">경북관련성</div>
                        <div class="detail-value">
                            <span class="grade-badge ${this.getGradeClass(project.grade)}">${project.grade}</span>
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">관련도점수</div>
                        <div class="detail-value">
                            <span class="${this.getScoreClass(project.score)}">${project.score}</span>
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">사업유형</div>
                        <div class="detail-value">${this.escapeHtml(project.type)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">지역관련성</div>
                        <div class="detail-value">${this.escapeHtml(project.region)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">사업기간</div>
                        <div class="detail-value">${this.escapeHtml(project.period)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">시행주체</div>
                        <div class="detail-value">${this.escapeHtml(project.agency)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">지방비매칭</div>
                        <div class="detail-value">${this.escapeHtml(project.matching)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">출처파일</div>
                        <div class="detail-value">${this.escapeHtml(project.source)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">사업내용</div>
                        <div class="detail-value">
                            <div class="detail-content">${this.escapeHtml(project.content)}</div>
                        </div>
                    </div>
                </div>
            `;
            
            this.showModal('detail-modal');
            
        } catch (error) {
            console.error('프로젝트 상세 정보 로드 오류:', error);
            this.showToast('프로젝트 상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }
    
    async generateReports() {
        if (this.selectedProjects.size === 0) {
            this.showToast('선택된 프로젝트가 없습니다.', 'warning');
            return;
        }
        
        this.showModal('report-modal');
        
        // 진행 상황 초기화
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('progress-text').textContent = '검토의견서를 생성하고 있습니다...';
        document.querySelector('.report-progress').style.display = 'block';
        document.getElementById('report-results').style.display = 'none';
        
        try {
            // 진행 상황 시뮬레이션
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 85) progress = 85;
                document.getElementById('progress-fill').style.width = `${progress}%`;
            }, 800);
            
            const response = await fetch('/api/generate_report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projects: Array.from(this.selectedProjects)
                })
            });
            
            clearInterval(progressInterval);
            document.getElementById('progress-fill').style.width = '100%';
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 결과 표시
            document.querySelector('.report-progress').style.display = 'none';
            document.getElementById('report-results').style.display = 'block';
            
            const resultsHtml = `
                <div class="report-summary" style="text-align: center; margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <h4 style="color: var(--success-color); margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle"></i> 검토의견서 생성 완료
                    </h4>
                    <p>총 ${result.generated_count}개의 검토의견서가 생성되었습니다.</p>
                </div>
                <div class="report-files">
                    ${result.files.map(file => `
                        <div class="report-file">
                            <div class="report-file-info">
                                <div class="report-file-name">${this.escapeHtml(file.filename)}</div>
                                <div class="report-file-details">
                                    프로젝트: ${this.escapeHtml(file.project_name)} | 우선순위: ${file.priority}%
                                </div>
                            </div>
                            <div class="report-file-actions">
                                <a href="/download_report/${encodeURIComponent(file.filename)}" 
                                   class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;" target="_blank">
                                    <i class="fas fa-download"></i> 다운로드
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('report-results').innerHTML = resultsHtml;
            
            this.showToast(`${result.generated_count}개의 검토의견서가 생성되었습니다.`, 'success');
            
        } catch (error) {
            console.error('검토의견서 생성 오류:', error);
            clearInterval(progressInterval);
            document.querySelector('.report-progress').style.display = 'none';
            document.getElementById('report-results').style.display = 'block';
            document.getElementById('report-results').innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">검토의견서 생성 중 오류가 발생했습니다.</p>
                    <p class="error-detail" style="font-size: 0.875rem; color: var(--text-secondary);">${error.message}</p>
                </div>
            `;
            this.showToast('검토의견서 생성 중 오류가 발생했습니다.', 'error');
        }
    }
    
    async exportExcel() {
        try {
            this.showToast('엑셀 파일을 생성하고 있습니다...', 'info');
            
            const response = await fetch('/api/export_excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filters: this.currentFilters
                })
            });
            
            if (!response.ok) {
                throw new Error('엑셀 내보내기 실패');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `경북관련사업_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast('엑셀 파일이 다운로드되었습니다.', 'success');
            
        } catch (error) {
            console.error('엑셀 내보내기 오류:', error);
            this.showToast('엑셀 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.querySelector('.table-container').style.display = show ? 'none' : 'block';
        document.getElementById('pagination').style.display = show ? 'none' : 'flex';
    }
    
    showEmptyState(show) {
        document.getElementById('empty-state').style.display = show ? 'block' : 'none';
        document.querySelector('.table-container').style.display = show ? 'none' : 'block';
        document.getElementById('pagination').style.display = show ? 'none' : 'flex';
    }
    
    updateResultsCount() {
        document.getElementById('results-count').textContent = this.totalProjects.toLocaleString();
    }
    
    updateCurrentDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('current-date').textContent = dateStr;
    }
    
    // 유틸리티 함수들
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatBudget(budget) {
        if (!budget) return '-';
        
        // 천원 단위 제거 및 숫자 추출
        const numStr = budget.toString().replace(/[^\d]/g, '');
        if (!numStr) return budget;
        
        const num = parseInt(numStr);
        if (num >= 1000000000) {
            return `${(num / 1000000000).toFixed(1)}조원`;
        } else if (num >= 100000000) {
            return `${(num / 100000000).toFixed(0)}억원`;
        } else if (num >= 10000) {
            return `${(num / 10000).toFixed(0)}만원`;
        } else {
            return `${num.toLocaleString()}원`;
        }
    }
    
    getGradeClass(grade) {
        if (!grade) return '';
        if (grade.includes('A급')) return 'grade-a';
        if (grade.includes('B급')) return 'grade-b';
        if (grade.includes('C급')) return 'grade-c';
        return '';
    }
    
    getScoreClass(score) {
        if (score >= 250) return 'score-high';
        if (score >= 150) return 'score-medium';
        return 'score-low';
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${iconMap[type]}"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 4초 후 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }
}

// 전역 오류 처리
window.addEventListener('unhandledrejection', function(event) {
    console.error('처리되지 않은 Promise 오류:', event.reason);
    
    // 사용자에게 친화적인 메시지 표시
    if (typeof dashboard !== 'undefined' && dashboard.showToast) {
        dashboard.showToast('예상치 못한 오류가 발생했습니다. 페이지를 새로고침해보세요.', 'error');
    }
    
    // 기본 오류 처리 방지
    event.preventDefault();
});

window.addEventListener('error', function(event) {
    console.error('JavaScript 오류:', event.error);
});

// 전역 대시보드 인스턴스
const dashboard = new GyeongbukDashboard();