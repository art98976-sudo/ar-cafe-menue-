// ============================================
// FOOD DATA
// ============================================
const menuData = {
    pizza: {
        icon: '🍕', name: 'Margherita Pizza', price: 150,
        desc: 'Fresh tomato sauce, mozzarella cheese and aromatic basil on a perfectly crispy thin crust.',
        calories: '320 kcal', time: '15 min', rating: '4.8',
        model: './pizza.glb',
    },
    burger: {
        icon: '🍔', name: 'Classic Burger', price: 200,
        desc: 'Juicy beef patty with melted cheese, crisp lettuce and tomato in a toasted sesame bun.',
        calories: '540 kcal', time: '10 min', rating: '4.7',
        model: './burger.glb',
    },
    drink: {
        icon: '🥤', name: 'Fresh Lemonade', price: 80,
        desc: 'Cold pressed lemonade with fresh mint leaves, a squeeze of lime and a hint of honey.',
        calories: '85 kcal', time: '5 min', rating: '4.9',
        model: './drink.glb',
    },
};

// ============================================
// CART STATE
// ============================================
let cart = {};
let currentModel = null;
let arQty = 1;

// ============================================
// THREE.JS VIEWER
// ============================================
let threeRenderer, threeScene, threeCamera, threeControls, threeAnimId;
let loadedModel = null;

function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    const container = document.getElementById('ar-page');

    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(container.clientWidth, container.clientHeight);
    threeRenderer.setClearColor(0x1a1a2e, 1);
    threeRenderer.shadowMap.enabled = true;

    threeScene = new THREE.Scene();

    // Camera
    threeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    threeCamera.position.set(0, 1, 3);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    threeScene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    threeScene.add(dirLight);

    const pointLight = new THREE.PointLight(0xd4a574, 0.6, 20);
    pointLight.position.set(-3, 3, -3);
    threeScene.add(pointLight);

    // OrbitControls — touch + mouse rotate/zoom
    threeControls = new THREE.OrbitControls(threeCamera, canvas);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.minDistance = 1;
    threeControls.maxDistance = 8;
    threeControls.enablePan = false;
    threeControls.autoRotate = true;
    threeControls.autoRotateSpeed = 1.5;

    // Stop auto rotate on touch
    canvas.addEventListener('touchstart', () => { threeControls.autoRotate = false; });
    canvas.addEventListener('mousedown', () => { threeControls.autoRotate = false; });

    animate();
}

function animate() {
    threeAnimId = requestAnimationFrame(animate);
    if (threeControls) threeControls.update();
    if (threeRenderer && threeScene && threeCamera) {
        threeRenderer.render(threeScene, threeCamera);
    }
}

function loadGLBModel(modelPath) {
    // Remove old model
    if (loadedModel) {
        threeScene.remove(loadedModel);
        loadedModel = null;
    }

    document.getElementById('ar-loading').style.display = 'flex';

    const loader = new THREE.GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            loadedModel = gltf.scene;

            // Auto-center and scale
            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim;

            loadedModel.scale.setScalar(scale);
            loadedModel.position.sub(center.multiplyScalar(scale));

            threeScene.add(loadedModel);
            document.getElementById('ar-loading').style.display = 'none';

            // Reset camera
            threeCamera.position.set(0, 1, 3);
            threeControls.reset();
            threeControls.autoRotate = true;
        },
        function (xhr) {
            // progress
        },
        function (error) {
            console.error('Model load error:', error);
            document.getElementById('ar-loading').style.display = 'none';
            // Show emoji fallback if no model file
            showEmojiModel();
        }
    );
}

function showEmojiModel() {
    // Fallback: show a spinning sphere with item color if no .glb
    const geo = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.3, metalness: 0.2 });
    loadedModel = new THREE.Mesh(geo, mat);
    threeScene.add(loadedModel);
}

function resizeRenderer() {
    if (!threeRenderer) return;
    const container = document.getElementById('ar-page');
    const w = container.clientWidth;
    const h = container.clientHeight;
    threeRenderer.setSize(w, h);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
}

// ============================================
// OPEN AR — shows 3D viewer directly
// ============================================
function openAR(modelId) {
    currentModel = modelId;
    const item = menuData[modelId];
    arQty = 1;

    // Update UI
    document.getElementById('ar-qty-num').innerText = '1';
    document.getElementById('ar-food-name').innerText = item.name;
    document.getElementById('ar-food-price').innerText = 'Rs. ' + item.price;
    document.getElementById('ar-detail-name').innerText = item.name;
    document.getElementById('ar-detail-price').innerText = 'Rs. ' + item.price;
    document.getElementById('ar-detail-desc').innerText = item.desc;
    document.getElementById('ar-cal-row').innerHTML = `
        <div class="cal-badge">🔥 ${item.calories}</div>
        <div class="cal-badge">⏱️ ${item.time}</div>
        <div class="cal-badge">⭐ ${item.rating}</div>`;

    // Show AR page
    document.getElementById('menu-page').style.display = 'none';
    document.getElementById('bottom-nav').style.display = 'none';
    document.getElementById('cart-bar').classList.remove('visible');
    document.getElementById('ar-page').style.display = 'block';
    document.getElementById('ar-topbar').style.display = 'flex';
    document.getElementById('ar-bottombar').style.display = 'flex';
    document.getElementById('back-btn').classList.add('visible');

    // Init Three.js if not already
    if (!threeRenderer) {
        initThreeJS();
    }

    resizeRenderer();
    loadGLBModel(item.model);

    history.pushState({ page: 'ar' }, '');
}

// ============================================
// CLOSE AR
// ============================================
function closeAR() {
    currentModel = null;

    document.getElementById('ar-page').style.display = 'none';
    document.getElementById('ar-topbar').style.display = 'none';
    document.getElementById('ar-bottombar').style.display = 'none';
    document.getElementById('back-btn').classList.remove('visible');
    document.getElementById('menu-page').style.display = 'flex';
    document.getElementById('bottom-nav').style.display = 'flex';

    // Stop auto rotate
    if (threeControls) threeControls.autoRotate = false;

    updateCartBar();
}

// ============================================
// RESET MODEL
// ============================================
function resetModel() {
    if (threeControls) {
        threeControls.reset();
        threeControls.autoRotate = true;
    }
}

// ============================================
// CART FUNCTIONS
// ============================================
function quickAdd(id) {
    addItemToCart(id, 1);
    showToast('✅', menuData[id].name + ' added!', 'Rs. ' + menuData[id].price);
}

function addToCart() {
    if (!currentModel) return;
    addItemToCart(currentModel, arQty);
    showToast('🛒', menuData[currentModel].name + ' × ' + arQty + ' added!',
        'Rs. ' + (menuData[currentModel].price * arQty));
}

function addItemToCart(id, qty) {
    if (cart[id]) {
        cart[id].qty += qty;
    } else {
        cart[id] = { qty: qty };
    }
    updateCartBar();
}

function removeFromCart(id) {
    if (!cart[id]) return;
    cart[id].qty -= 1;
    if (cart[id].qty <= 0) delete cart[id];
    renderCartPage();
    updateCartBar();
}

function addFromCart(id) {
    if (cart[id]) cart[id].qty += 1;
    renderCartPage();
    updateCartBar();
}

function getCartCount() {
    return Object.values(cart).reduce((sum, v) => sum + v.qty, 0);
}

function getCartTotal() {
    return Object.entries(cart).reduce((sum, [id, v]) => {
        return sum + (menuData[id].price * v.qty);
    }, 0);
}

function updateCartBar() {
    const count = getCartCount();
    const total = getCartTotal();
    const bar = document.getElementById('cart-bar');
    if (count > 0) {
        bar.classList.add('visible');
        document.getElementById('cart-count').innerText = count + ' item' + (count > 1 ? 's' : '');
        document.getElementById('cart-total').innerText = 'Rs. ' + total;
    } else {
        bar.classList.remove('visible');
    }
}

// ============================================
// QUANTITY
// ============================================
function changeQty(delta) {
    arQty = Math.max(1, Math.min(10, arQty + delta));
    document.getElementById('ar-qty-num').innerText = arQty;
}

function orderNow() {
    if (!currentModel) return;
    addItemToCart(currentModel, arQty);
    closeAR();
    setTimeout(() => placeOrder(), 300);
}

// ============================================
// CART PAGE
// ============================================
function openCart() {
    renderCartPage();
    document.getElementById('cart-page').classList.add('open');
    history.pushState({ page: 'cart' }, '');
}

function closeCart() {
    document.getElementById('cart-page').classList.remove('open');
}

function renderCartPage() {
    const container = document.getElementById('cart-items');
    const empty = document.getElementById('empty-cart');
    const keys = Object.keys(cart);

    if (keys.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
    } else {
        empty.style.display = 'none';
        container.innerHTML = keys.map(id => {
            const item = menuData[id];
            const qty = cart[id].qty;
            const total = item.price * qty;
            return `
            <div class="cart-item">
                <div class="cart-item-icon">${item.icon}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">Rs. ${item.price} × ${qty} = Rs. ${total}</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="removeFromCart('${id}')">−</button>
                    <div class="qty-num">${qty}</div>
                    <button class="qty-btn" onclick="addFromCart('${id}')">+</button>
                </div>
            </div>`;
        }).join('');
    }

    const subtotal = getCartTotal();
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;
    document.getElementById('summary-subtotal').innerText = 'Rs. ' + subtotal;
    document.getElementById('summary-tax').innerText = 'Rs. ' + tax;
    document.getElementById('summary-total').innerText = 'Rs. ' + total;
}

// ============================================
// ORDER
// ============================================
function placeOrder() {
    if (getCartCount() === 0) return;
    const orderId = '#' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('order-id-text').innerText = 'Order ' + orderId;
    cart = {};
    updateCartBar();
    document.getElementById('cart-page').classList.remove('open');
    document.getElementById('order-success').classList.add('open');
}

function backToMenu() {
    document.getElementById('order-success').classList.remove('open');
    showMenu();
}

function showMenu() {
    document.getElementById('menu-page').style.display = 'flex';
    document.getElementById('bottom-nav').style.display = 'flex';
}

// ============================================
// PHONE BACK BUTTON
// ============================================
window.addEventListener('popstate', function () {
    if (document.getElementById('ar-page').style.display === 'block') {
        closeAR(); return;
    }
    if (document.getElementById('cart-page').classList.contains('open')) {
        closeCart(); return;
    }
    if (document.getElementById('order-success').classList.contains('open')) {
        backToMenu(); return;
    }
});

history.pushState({ page: 'menu' }, '');

// ============================================
// TOAST
// ============================================
function showToast(icon, msg, sub) {
    document.getElementById('toast-icon').innerText = icon;
    document.getElementById('toast-msg').innerText = msg;
    document.getElementById('toast-sub').innerText = sub;
    const toast = document.getElementById('toast');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 1800);
}

// Resize on window resize
window.addEventListener('resize', resizeRenderer);
