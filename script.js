// GÜNCEL Karo boyutları (metre cinsinden)
const TILE_WIDTH = 0.025;    // 25mm
const TILE_HEIGHT = 0.34914; // 349.14mm
const TILE_DEPTH = 0.150;    // 150mm

// Durum değişkenleri
let placementMode = false;
let corners = [];
let tileContainer;
let gridVisible = true;
let isVertical = true;

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    tileContainer = document.querySelector('#tile-container');
    setupClickHandler();
    console.log('✅ AR Sistemi hazır!');
    console.log('📏 Karo boyutları:', TILE_WIDTH * 1000, 'x', TILE_HEIGHT * 1000, 'x', TILE_DEPTH * 1000, 'mm');
});

// Tıklama event'i
function setupClickHandler() {
    const scene = document.querySelector('a-scene');
    
    scene.addEventListener('click', (event) => {
        if (!placementMode) {
            placeSingleTile(event);
        } else {
            addCorner(event);
        }
    });
}

// Tek karo yerleştirme
function placeSingleTile(event) {
    const camera = document.querySelector('[camera]');
    const cameraPosition = camera.getAttribute('position');
    const cameraRotation = camera.getAttribute('rotation');
    
    const distance = 1.5;
    const x = cameraPosition.x - Math.sin(cameraRotation.y * Math.PI / 180) * distance;
    const y = cameraPosition.y - 0.5;
    const z = cameraPosition.z - Math.cos(cameraRotation.y * Math.PI / 180) * distance;
    
    createTile(x, y, z);
    updateStatus('Karo yerleştirildi! ✅');
}

// Tek karo oluştur
function createTile(x, y, z, rotationY = 0) {
    const tile = document.createElement('a-entity');
    
    tile.setAttribute('gltf-model', '#karo-model');
    tile.setAttribute('position', `${x} ${y} ${z}`);
    
    if (!isVertical) {
        tile.setAttribute('rotation', `0 ${rotationY} 90`);
    } else {
        tile.setAttribute('rotation', `0 ${rotationY} 0`);
    }
    
    tile.setAttribute('scale', '1 1 1');
    tile.setAttribute('shadow', 'cast: true; receive: true');
    tile.setAttribute('class', 'clickable');
    tile.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 300');
    
    tileContainer.appendChild(tile);
    
    return tile;
}

// Alan seçim modunu başlat
function startPlacement() {
    placementMode = true;
    corners = [];
    document.getElementById('placement-mode').style.display = 'block';
    document.getElementById('corner-count').textContent = '0';
    updateStatus('🎯 Duvarın 4 köşesini işaretleyin');
}

// Köşe ekle
function addCorner(event) {
    const camera = document.querySelector('[camera]');
    const cameraPosition = camera.getAttribute('position');
    const cameraRotation = camera.getAttribute('rotation');
    
    const distance = 2;
    const x = cameraPosition.x - Math.sin(cameraRotation.y * Math.PI / 180) * distance;
    const y = cameraPosition.y;
    const z = cameraPosition.z - Math.cos(cameraRotation.y * Math.PI / 180) * distance;
    
    corners.push({x, y, z});
    
    createCornerMarker(x, y, z, corners.length);
    
    document.getElementById('corner-count').textContent = corners.length;
    updateStatus(`Köşe ${corners.length}/4 işaretlendi`);
    
    if (corners.length === 4) {
        setTimeout(() => {
            fillArea();
            placementMode = false;
            document.getElementById('placement-mode').style.display = 'none';
        }, 500);
    }
}

// Köşe işareti
function createCornerMarker(x, y, z, number) {
    const marker = document.createElement('a-sphere');
    marker.setAttribute('position', `${x} ${y} ${z}`);
    marker.setAttribute('radius', '0.05');
    marker.setAttribute('color', '#FF0000');
    marker.setAttribute('class', 'corner-marker');
    
    const text = document.createElement('a-text');
    text.setAttribute('value', number.toString());
    text.setAttribute('position', `${x} ${y + 0.1} ${z}`);
    text.setAttribute('align', 'center');
    text.setAttribute('color', '#FFFFFF');
    text.setAttribute('scale', '0.5 0.5 0.5');
    text.setAttribute('class', 'corner-marker');
    
    tileContainer.appendChild(marker);
    tileContainer.appendChild(text);
}

// Alanı karo ile doldur
function fillArea() {
    if (corners.length !== 4) return;
    
    updateStatus('⏳ Karolar hesaplanıyor...');
    
    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y));
    const maxY = Math.max(...corners.map(c => c.y));
    const avgZ = corners.reduce((sum, c) => sum + c.z, 0) / 4;
    
    const areaWidth = maxX - minX;
    const areaHeight = maxY - minY;
    
    const rows = Math.ceil(areaHeight / TILE_HEIGHT);
    const cols = Math.ceil(areaWidth / TILE_DEPTH);
    
    const totalTiles = rows * cols;
    
    updateStatus(`📊 ${rows}x${cols} grid (${totalTiles} karo) oluşturuluyor...`);
    
    let placedCount = 0;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = minX + (col * TILE_DEPTH) + (TILE_DEPTH / 2);
            const y = minY + (row * TILE_HEIGHT) + (TILE_HEIGHT / 2);
            
            setTimeout(() => {
                createTile(x, y, avgZ);
                placedCount++;
                
                if (placedCount === totalTiles) {
                    updateStatus(`✅ ${totalTiles} karo başarıyla yerleştirildi!`);
                }
            }, (row * cols + col) * 50);
        }
    }
    
    corners = [];
}

// Yatay/Dikey toggle
function toggleOrientation() {
    isVertical = !isVertical;
    updateStatus(isVertical ? '📏 Dikey mod' : '📐 Yatay mod');
}

// Temizle
function clearTiles() {
    tileContainer.innerHTML = '';
    corners = [];
    updateStatus('🗑️ Tüm karolar temizlendi');
}

// Grid toggle
function toggleGrid() {
    gridVisible = !gridVisible;
    const markers = document.querySelectorAll('.corner-marker');
    markers.forEach(marker => {
        marker.setAttribute('visible', gridVisible);
    });
    updateStatus(gridVisible ? '⊞ Grid gösteriliyor' : '⊟ Grid gizlendi');
}

// Durum güncelle
function updateStatus(message) {
    document.getElementById('status').textContent = message;
    console.log('Status:', message);
}

// Debug
console.log('=== KARO BOYUTLARI ===');
console.log('Genişlik:', TILE_WIDTH * 1000, 'mm');
console.log('Yükseklik:', TILE_HEIGHT * 1000, 'mm');
console.log('Derinlik:', TILE_DEPTH * 1000, 'mm');