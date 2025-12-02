// 模拟组数据
const groupsData = [
    { name: 'Group 1', memberCount: 4 },
    { name: 'Group 2', memberCount: 5 },
    { name: 'Group 3', memberCount: 4 },
    { name: 'Group 4', memberCount: 4 },
    { name: 'Group 5', memberCount: 4 },
    { name: 'Group 6', memberCount: 5 },
    { name: 'Group 7', memberCount: 4 },
    { name: 'Group 8', memberCount: 4 }
];

// SVG图标模板
const groupIconSVG = `
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path d="M640 773.973333a21.333333 21.333333 0 0 0-12.373333-19.413333l-95.957334-44.373333a106.666667 106.666667 0 0 1-61.866666-96.042667 374.485333 374.485333 0 0 0-0.213334-10.24 21.333333 21.333333 0 0 1 8.277334-20.352c24.362667-18.261333 34.133333-55.253333 34.133333-114.218667 0-56.32-30.378667-85.333333-85.333333-85.333333s-85.333333 29.013333-85.333334 85.333333c0 58.581333 9.898667 95.914667 34.176 114.261334a21.333333 21.333333 0 0 1 8.32 19.797333 261.973333 261.973333 0 0 0-0.213333 10.666667 106.666667 106.666667 0 0 1-61.866667 96.128l-96 44.373333A21.333333 21.333333 0 0 0 213.333333 773.973333V810.666667h426.666667v-36.693334zM298.666667 469.333333c0-80.298667 49.92-128 128-128s128 47.701333 128 128c0 65.578667-10.666667 111.445333-42.24 140.885334v3.626666a64 64 0 0 0 37.12 57.6l96 44.373334c22.613333 10.496 37.12 33.194667 37.12 58.112V853.333333H170.666667v-79.36a64 64 0 0 1 37.12-58.112l96-44.416a64 64 0 0 0 37.205333-61.226666C309.504 580.693333 298.666667 534.570667 298.666667 469.333333z m426.666666 170.666667h85.333334v-36.693333a21.333333 21.333333 0 0 0-12.373334-19.413334l-95.957333-44.373333a106.666667 106.666667 0 0 1-61.866667-96.042667 374.485333 374.485333 0 0 0-0.213333-10.24 21.333333 21.333333 0 0 1 8.277333-20.352c24.362667-18.261333 34.133333-55.253333 34.133334-114.218666 0-56.32-30.378667-85.333333-85.333334-85.333334-45.525333 0-74.197333 19.925333-82.688 58.794667a221.568 221.568 0 0 0-41.002666-11.861333C487.253333 203.392 532.650667 170.666667 597.333333 170.666667c78.08 0 128 47.701333 128 128 0 65.578667-10.666667 111.445333-42.24 140.885333v3.626667a64 64 0 0 0 37.12 57.6l96 44.373333c22.613333 10.496 37.12 33.194667 37.12 58.112V640a42.666667 42.666667 0 0 1-42.666666 42.666667h-85.333334v-42.666667z" fill="currentColor"/>
    </svg>
`;
// fetch from backend API
const userRole = "prof"
// 渲染组信息
function renderGroups() {
    if (userRole !== "prof"){
        return 
    }
    const groupInfoSection = document.getElementById('group-info-section');

    if (!groupInfoSection) {
        console.error('group-info-section element not found');
        return;
    }

    groupInfoSection.innerHTML = `
        <div class="section">
            <div class="section-header">
                <span>Groups Overview</span>
            </div>
            <div class="groups-grid">
                ${groupsData.map(group => `
                    <div class="group-summary-card">
                        <div class="group-icon">${groupIconSVG}</div>
                        <div class="group-summary-info">
                            <h3>${group.name}</h3>
                            <p>${group.memberCount} members</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Modal 控制函数
function showModal(type) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(type + '-modal').classList.add('active');
}

function hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('assignment-modal').classList.remove('active');
    document.getElementById('attendance-modal').classList.remove('active');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    renderGroups();
});

// 将函数暴露到全局作用域，供HTML中的onclick使用
window.showModal = showModal;
window.hideModal = hideModal;