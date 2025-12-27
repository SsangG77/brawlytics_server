// 이미지 미리보기
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const previewId = 'preview_' + e.target.name.replace('_image', '');
        const preview = document.getElementById(previewId);

        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
});

// 취소 버튼
document.getElementById('cancelBtn').addEventListener('click', () => {
    cancelEdit();
});

// 폼 제출
document.getElementById('brawlerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const editingId = document.getElementById('editingId').value;

    // 필수 값 검증
    const name = formData.get('name');
    const brawlerImage = formData.get('brawler_image');
    const rarity = formData.get('rarity');
    const role = formData.get('role');

    if (!name || !name.trim()) {
        alert('❌ 브롤러 이름을 입력해주세요.');
        return;
    }

    // 수정 모드가 아닐 때만 이미지 필수
    if (!editingId && (!brawlerImage || brawlerImage.size === 0)) {
        alert('❌ 브롤러 이미지를 업로드해주세요.');
        return;
    }

    if (!rarity) {
        alert('❌ 희귀도를 선택해주세요.');
        return;
    }

    if (!role) {
        alert('❌ 역할군을 선택해주세요.');
        return;
    }

    // 수정 모드가 아닐 때만 가젯, 스타파워, 하이퍼차지 이미지 검증
    if (!editingId) {
        const firstGadgetName = formData.get('first_gadget_name');
        const firstGadgetImage = formData.get('first_gadget_image');
        const secondGadgetName = formData.get('second_gadget_name');
        const secondGadgetImage = formData.get('second_gadget_image');

        if (firstGadgetName && firstGadgetName.trim() && (!firstGadgetImage || firstGadgetImage.size === 0)) {
            alert('❌ 가젯 1의 이미지를 업로드해주세요.');
            return;
        }

        if (firstGadgetImage && firstGadgetImage.size > 0 && (!firstGadgetName || !firstGadgetName.trim())) {
            alert('❌ 가젯 1의 이름을 입력해주세요.');
            return;
        }

        if (secondGadgetName && secondGadgetName.trim() && (!secondGadgetImage || secondGadgetImage.size === 0)) {
            alert('❌ 가젯 2의 이미지를 업로드해주세요.');
            return;
        }

        if (secondGadgetImage && secondGadgetImage.size > 0 && (!secondGadgetName || !secondGadgetName.trim())) {
            alert('❌ 가젯 2의 이름을 입력해주세요.');
            return;
        }

        const firstStarPowerName = formData.get('first_star_power_name');
        const firstStarPowerImage = formData.get('first_star_power_image');
        const secondStarPowerName = formData.get('second_star_power_name');
        const secondStarPowerImage = formData.get('second_star_power_image');

        if (firstStarPowerName && firstStarPowerName.trim() && (!firstStarPowerImage || firstStarPowerImage.size === 0)) {
            alert('❌ 스타파워 1의 이미지를 업로드해주세요.');
            return;
        }

        if (firstStarPowerImage && firstStarPowerImage.size > 0 && (!firstStarPowerName || !firstStarPowerName.trim())) {
            alert('❌ 스타파워 1의 이름을 입력해주세요.');
            return;
        }

        if (secondStarPowerName && secondStarPowerName.trim() && (!secondStarPowerImage || secondStarPowerImage.size === 0)) {
            alert('❌ 스타파워 2의 이미지를 업로드해주세요.');
            return;
        }

        if (secondStarPowerImage && secondStarPowerImage.size > 0 && (!secondStarPowerName || !secondStarPowerName.trim())) {
            alert('❌ 스타파워 2의 이름을 입력해주세요.');
            return;
        }

        const hyperchargeName = formData.get('hypercharge_name');
        const hyperchargeImage = formData.get('hypercharge_image');

        if (hyperchargeName && hyperchargeName.trim() && (!hyperchargeImage || hyperchargeImage.size === 0)) {
            alert('❌ 하이퍼차지의 이미지를 업로드해주세요.');
            return;
        }

        if (hyperchargeImage && hyperchargeImage.size > 0 && (!hyperchargeName || !hyperchargeName.trim())) {
            alert('❌ 하이퍼차지의 이름을 입력해주세요.');
            return;
        }
    } else {
        // 수정 모드일 때는 이미지 없이 이름만 변경할 수 있음
        // 새 이미지를 업로드하는 경우에만 이름과 함께 검증
        const firstGadgetName = formData.get('first_gadget_name');
        const firstGadgetImage = formData.get('first_gadget_image');
        const secondGadgetName = formData.get('second_gadget_name');
        const secondGadgetImage = formData.get('second_gadget_image');

        if (firstGadgetImage && firstGadgetImage.size > 0 && (!firstGadgetName || !firstGadgetName.trim())) {
            alert('❌ 가젯 1의 이미지를 업로드할 때는 이름도 입력해주세요.');
            return;
        }

        if (secondGadgetImage && secondGadgetImage.size > 0 && (!secondGadgetName || !secondGadgetName.trim())) {
            alert('❌ 가젯 2의 이미지를 업로드할 때는 이름도 입력해주세요.');
            return;
        }

        const firstStarPowerName = formData.get('first_star_power_name');
        const firstStarPowerImage = formData.get('first_star_power_image');
        const secondStarPowerName = formData.get('second_star_power_name');
        const secondStarPowerImage = formData.get('second_star_power_image');

        if (firstStarPowerImage && firstStarPowerImage.size > 0 && (!firstStarPowerName || !firstStarPowerName.trim())) {
            alert('❌ 스타파워 1의 이미지를 업로드할 때는 이름도 입력해주세요.');
            return;
        }

        if (secondStarPowerImage && secondStarPowerImage.size > 0 && (!secondStarPowerName || !secondStarPowerName.trim())) {
            alert('❌ 스타파워 2의 이미지를 업로드할 때는 이름도 입력해주세요.');
            return;
        }

        const hyperchargeName = formData.get('hypercharge_name');
        const hyperchargeImage = formData.get('hypercharge_image');

        if (hyperchargeImage && hyperchargeImage.size > 0 && (!hyperchargeName || !hyperchargeName.trim())) {
            alert('❌ 하이퍼차지의 이미지를 업로드할 때는 이름도 입력해주세요.');
            return;
        }
    }

    // 버피는 선택 사항이므로 유효성 검사 없음

    try {
        let url = '/admin/brawlers';
        let method = 'POST';

        if (editingId) {
            url = `/admin/brawlers/${editingId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert(editingId ? '✅ 수정 완료!' : '✅ 저장 완료!');
            cancelEdit();
            loadBrawlers(); // 목록 새로고침
        } else {
            alert('❌ 저장 실패: ' + result.error);
        }
    } catch (error) {
        alert('❌ 저장 실패: ' + error.message);
    }
});

// 수정 모드 취소
function cancelEdit() {
    document.getElementById('editingId').value = '';
    document.getElementById('formTitle').textContent = '브롤러 등록';
    document.getElementById('brawlerForm').reset();
    document.querySelectorAll('.preview').forEach(img => img.style.display = 'none');
    document.querySelectorAll('input[name="rare_gears"]').forEach(checkbox => checkbox.checked = true);
    document.getElementById('cancelBtn').style.display = 'none';
}

// 브롤러 수정
async function editBrawler(id) {
    try {
        const response = await fetch('/admin/brawlers');
        const data = await response.json();
        const brawler = data.brawlers.find(b => b.id === id);

        if (!brawler) {
            alert('❌ 브롤러를 찾을 수 없습니다.');
            return;
        }

        // 폼에 데이터 채우기
        document.getElementById('editingId').value = brawler.id;
        document.getElementById('formTitle').textContent = '브롤러 수정';
        document.querySelector('input[name="name"]').value = brawler.name;

        // 이미지 미리보기 (브롤러 이름 폴더에서 로드)
        const brawlerFolder = `/uploads/brawlers/${brawler.name}`;

        // 브롤러 이미지
        const brawlerImagePreview = document.getElementById('preview_brawler');
        brawlerImagePreview.src = `${brawlerFolder}/${brawler.name}.png`;
        brawlerImagePreview.style.display = 'block';
        brawlerImagePreview.onerror = () => {
            brawlerImagePreview.src = `${brawlerFolder}/${brawler.name}.jpg`;
            brawlerImagePreview.onerror = () => {
                brawlerImagePreview.style.display = 'none';
            };
        };

        // 가젯
        document.querySelector('input[name="first_gadget_name"]').value = brawler.firstGadget?.name || '';
        if (brawler.firstGadget?.name) {
            const preview = document.getElementById('preview_first_gadget');
            const imageName = brawler.firstGadget.image || `${brawler.firstGadget.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.firstGadget.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        document.querySelector('input[name="second_gadget_name"]').value = brawler.secondGadget?.name || '';
        if (brawler.secondGadget?.name) {
            const preview = document.getElementById('preview_second_gadget');
            const imageName = brawler.secondGadget.image || `${brawler.secondGadget.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.secondGadget.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        // 스타파워
        document.querySelector('input[name="first_star_power_name"]').value = brawler.firstStarPower?.name || '';
        if (brawler.firstStarPower?.name) {
            const preview = document.getElementById('preview_first_star_power');
            const imageName = brawler.firstStarPower.image || `${brawler.firstStarPower.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.firstStarPower.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        document.querySelector('input[name="second_star_power_name"]').value = brawler.secondStarPower?.name || '';
        if (brawler.secondStarPower?.name) {
            const preview = document.getElementById('preview_second_star_power');
            const imageName = brawler.secondStarPower.image || `${brawler.secondStarPower.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.secondStarPower.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        // 하이퍼차지
        document.querySelector('input[name="hypercharge_name"]').value = brawler.hypercharge?.name || '';
        if (brawler.hypercharge?.name) {
            const preview = document.getElementById('preview_hypercharge');
            const imageName = brawler.hypercharge.image || `${brawler.hypercharge.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.hypercharge.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        // 버피
        document.querySelector('input[name="gadget_buff_name"]').value = brawler.gadgetBuff?.name || '';
        if (brawler.gadgetBuff?.name) {
            const preview = document.getElementById('preview_gadget_buff');
            const imageName = brawler.gadgetBuff.image || `${brawler.gadgetBuff.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.gadgetBuff.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        document.querySelector('input[name="star_power_buff_name"]').value = brawler.starPowerBuff?.name || '';
        if (brawler.starPowerBuff?.name) {
            const preview = document.getElementById('preview_star_power_buff');
            const imageName = brawler.starPowerBuff.image || `${brawler.starPowerBuff.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.starPowerBuff.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        document.querySelector('input[name="hypercharge_buff_name"]').value = brawler.hyperchargeBuff?.name || '';
        if (brawler.hyperchargeBuff?.name) {
            const preview = document.getElementById('preview_hypercharge_buff');
            const imageName = brawler.hyperchargeBuff.image || `${brawler.hyperchargeBuff.name}.png`;
            preview.src = `${brawlerFolder}/${imageName}`;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.src = `${brawlerFolder}/${brawler.hyperchargeBuff.name}.jpg`;
                preview.onerror = () => preview.style.display = 'none';
            };
        }

        // 메타 정보
        document.querySelector('select[name="rarity"]').value = brawler.rarity;
        document.querySelector('select[name="role"]').value = brawler.role;

        // 기어 체크박스
        document.querySelectorAll('input[name="rare_gears"]').forEach(checkbox => {
            checkbox.checked = brawler.rareGears && brawler.rareGears.includes(checkbox.value);
        });

        // 취소 버튼 표시
        document.getElementById('cancelBtn').style.display = 'inline-block';

        // 폼으로 스크롤
        document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading brawler:', error);
        alert('❌ 브롤러 로드 실패');
    }
}

// 브롤러 목록 로드
async function loadBrawlers(filterRole = 'all') {
    try {
        const response = await fetch('/admin/brawlers');
        const data = await response.json();
        let brawlers = data.brawlers || [];

        // 역할별 필터링
        if (filterRole !== 'all') {
            brawlers = brawlers.filter(b => b.role === filterRole);
        }

        document.getElementById('brawlerCount').textContent = brawlers.length;

        const listContainer = document.getElementById('brawlerList');
        listContainer.innerHTML = '';

        if (brawlers.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:#999;">등록된 브롤러가 없습니다.</p>';
            return;
        }

        brawlers.forEach(brawler => {
            const card = document.createElement('div');
            card.className = 'brawler-card';

            const brawlerFolder = `/uploads/brawlers/${brawler.name}`;
            const brawlerImageUrl = `${brawlerFolder}/${brawler.name}.png`;

            // 아이템 HTML 생성 함수
            const createItemHTML = (item, itemType) => {
                if (!item || !item.name) {
                    return `<div class="item-row"><span class="item-empty">없음</span></div>`;
                }
                const imageName = item.image || `${item.name}.png`;
                const imageUrl = `${brawlerFolder}/${imageName}`;
                return `
                    <div class="item-row">
                        <img src="${imageUrl}" alt="${item.name}" class="item-image"
                             onerror="this.src='${brawlerFolder}/${item.name}.jpg'; this.onerror=function(){this.style.display='none'};">
                        <span class="item-name">${item.name}</span>
                    </div>
                `;
            };

            card.innerHTML = `
                <div class="brawler-header">
                    <img src="${brawlerImageUrl}" alt="${brawler.name}" class="brawler-main-image"
                         onerror="this.src='${brawlerFolder}/${brawler.name}.jpg'; this.onerror=null;">
                    <div class="brawler-info">
                        <h3>${brawler.name}</h3>
                        <div class="meta-info">
                            <span><strong>ID:</strong> ${brawler.id}</span>
                            <span class="badge badge-${brawler.rarity}">${brawler.rarity}</span>
                            <span class="badge" style="background:#34495e">${brawler.role}</span>
                        </div>
                    </div>
                </div>

                <div class="items-grid">
                    <div class="item-section">
                        <h4>가젯</h4>
                        ${createItemHTML(brawler.firstGadget, 'gadget')}
                        ${createItemHTML(brawler.secondGadget, 'gadget')}
                    </div>

                    <div class="item-section">
                        <h4>스타파워</h4>
                        ${createItemHTML(brawler.firstStarPower, 'starpower')}
                        ${createItemHTML(brawler.secondStarPower, 'starpower')}
                    </div>

                    <div class="item-section">
                        <h4>하이퍼차지</h4>
                        ${createItemHTML(brawler.hypercharge, 'hypercharge')}
                    </div>

                    <div class="item-section">
                        <h4>버피</h4>
                        ${brawler.gadgetBuff ? createItemHTML(brawler.gadgetBuff, 'buff') : '<div class="item-row"><span class="item-empty">가젯 버피 없음</span></div>'}
                        ${brawler.starPowerBuff ? createItemHTML(brawler.starPowerBuff, 'buff') : '<div class="item-row"><span class="item-empty">스타파워 버피 없음</span></div>'}
                        ${brawler.hyperchargeBuff ? createItemHTML(brawler.hyperchargeBuff, 'buff') : '<div class="item-row"><span class="item-empty">하이퍼차지 버피 없음</span></div>'}
                    </div>
                </div>

                <div class="button-group">
                    <button class="btn-edit" onclick="editBrawler(${brawler.id})">✏️ 수정</button>
                    <button class="btn-delete" onclick="deleteBrawler(${brawler.id})">🗑️ 삭제</button>
                </div>
            `;

            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading brawlers:', error);
        alert('브롤러 목록 로드 실패');
    }
}

// 브롤러 삭제
async function deleteBrawler(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`/admin/brawlers/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('✅ 삭제 완료!');
            loadBrawlers();
        } else {
            alert('❌ 삭제 실패');
        }
    } catch (error) {
        alert('❌ 삭제 실패: ' + error.message);
    }
}

// 탭 클릭 이벤트
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // 모든 탭 버튼에서 active 제거
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        // 클릭한 탭에 active 추가
        btn.classList.add('active');

        // 선택한 역할로 필터링
        const role = btn.dataset.role;
        loadBrawlers(role);
    });
});

// 초기 로드
loadBrawlers();
