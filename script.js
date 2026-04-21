const menuData = {
    pizza:  { icon:'🍕', name:'Margherita Pizza', price:150, desc:'Fresh tomato sauce, mozzarella cheese and aromatic basil on a perfectly crispy thin crust.', calories:'320 kcal', time:'15 min', rating:'4.8', model:'./pizza.glb',  arId:'ar-pizza'  },
    burger: { icon:'🍔', name:'Classic Burger',   price:200, desc:'Juicy beef patty with melted cheese, crisp lettuce and tomato in a toasted sesame bun.',   calories:'540 kcal', time:'10 min', rating:'4.7', model:'./burger.glb', arId:'ar-burger' },
    drink:  { icon:'🥤', name:'Fresh Lemonade',   price:80,  desc:'Cold pressed lemonade with fresh mint leaves, a squeeze of lime and a hint of honey.',      calories:'85 kcal',  time:'5 min',  rating:'4.9', model:'./drink.glb',  arId:'ar-drink'  },
};

let cart = {}, currentModel = null, arQty = 1, viewerMode = null;
let threeRenderer, threeScene, threeCamera, threeControls, loadedModel, T;

// ── Get Three.js ──
function getThree() {
    if (T) return T;
    T = (window.AFRAME && window.AFRAME.THREE) || window.THREE;
    return T;
}

// ── Init Three.js ──
function initThreeJS() {
    const THREE = getThree();
    if (!THREE) { console.error('THREE not found'); return; }
    const canvas = document.getElementById('three-canvas');
    const container = document.getElementById('viewer-3d');
    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(container.clientWidth, container.clientHeight);
    threeRenderer.setClearColor(0x111111, 1);
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x111111);
    threeCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    threeCamera.position.set(0, 0.5, 3);
    threeScene.add(new THREE.AmbientLight(0xffffff, 3));
    const d = new THREE.DirectionalLight(0xffffff, 3);
    d.position.set(5, 10, 7);
    threeScene.add(d);
    const d2 = new THREE.DirectionalLight(0xffe8d0, 2);
    d2.position.set(-5, 5, -5);
    threeScene.add(d2);
    // Get OrbitControls from AFRAME.THREE since that's where it was patched
    const OC = (window.AFRAME && window.AFRAME.THREE && window.AFRAME.THREE.OrbitControls)
        || THREE.OrbitControls
        || window.OrbitControls;
    if (!OC) { console.error('OrbitControls not found'); return; }
    threeControls = new OC(threeCamera, canvas);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.minDistance = 1;
    threeControls.maxDistance = 8;
    threeControls.enablePan = false;
    threeControls.autoRotate = true;
    threeControls.autoRotateSpeed = 1.5;
    canvas.addEventListener('touchstart', () => { threeControls.autoRotate = false; });
    canvas.addEventListener('mousedown',  () => { threeControls.autoRotate = false; });
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (threeControls) threeControls.update();
    if (threeRenderer && threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
}

function loadGLBModel(path) {
    const THREE = getThree();
    if (!THREE) return;
    if (loadedModel) { threeScene.remove(loadedModel); loadedModel = null; }
    document.getElementById('ar-loading').style.display = 'flex';
    const LC = THREE.GLTFLoader || window.GLTFLoader;
    if (!LC) { console.error('GLTFLoader not found'); return; }
    const loader = new LC();
    const DC = window.DRACOLoader || THREE.DRACOLoader;
    if (DC) {
        const draco = new DC();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        draco.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(draco);
    }
    loader.load(path,
        function(gltf) {
            loadedModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const scale = 2.5 / Math.max(size.x, size.y, size.z);
            loadedModel.scale.setScalar(scale);
            loadedModel.position.sub(center.multiplyScalar(scale));
            threeScene.add(loadedModel);
            document.getElementById('ar-loading').style.display = 'none';
            threeCamera.position.set(0, 0.5, 3);
            threeControls.reset();
            threeControls.autoRotate = true;
        },
        null,
        function(err) {
            console.error('Load error:', err);
            document.getElementById('ar-loading').style.display = 'none';
            // Show colored sphere as fallback
            const geo = new THREE.SphereGeometry(1, 32, 32);
            const mat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
            loadedModel = new THREE.Mesh(geo, mat);
            threeScene.add(loadedModel);
        }
    );
}

function resizeRenderer() {
    if (!threeRenderer || !threeCamera) return;
    const c = document.getElementById('viewer-3d');
    if (!c.clientWidth || !c.clientHeight) return;
    threeRenderer.setSize(c.clientWidth, c.clientHeight);
    threeCamera.aspect = c.clientWidth / c.clientHeight;
    threeCamera.updateProjectionMatrix();
}

// ── Update UI ──
function updateViewerUI(id) {
    const item = menuData[id];
    arQty = 1;
    document.getElementById('ar-qty-num').innerText = '1';
    document.getElementById('ar-food-name').innerText = item.name;
    document.getElementById('ar-food-price').innerText = 'Rs. ' + item.price;
    document.getElementById('ar-detail-name').innerText = item.name;
    document.getElementById('ar-detail-price').innerText = 'Rs. ' + item.price;
    document.getElementById('ar-detail-desc').innerText = item.desc;
    document.getElementById('ar-cal-row').innerHTML =
        `<div class="cal-badge">🔥 ${item.calories}</div>
         <div class="cal-badge">⏱️ ${item.time}</div>
         <div class="cal-badge">⭐ ${item.rating}</div>`;
    document.getElementById('menu-page').style.display = 'none';
    document.getElementById('bottom-nav').style.display = 'none';
    document.getElementById('cart-bar').classList.remove('visible');
    document.getElementById('ar-topbar').style.display = 'flex';
    document.getElementById('ar-bottombar').style.display = 'flex';
    document.getElementById('back-btn').classList.add('visible');
}

// ── Open 3D ──
function open3D(id) {
    currentModel = id; viewerMode = '3d';
    updateViewerUI(id);
    document.getElementById('viewer-3d').style.display = 'block';
    document.getElementById('viewer-ar').style.display = 'none';
    document.getElementById('ar-hint-bar').innerText = '☝️ Drag to rotate · 🤏 Pinch to zoom';
    if (!threeRenderer) initThreeJS();
    resizeRenderer();
    loadGLBModel(menuData[id].model);
    history.pushState({ page: '3d' }, '');
}

// ── Open AR ──
function openAR(id) {
    currentModel = id; viewerMode = 'ar';
    updateViewerUI(id);
    document.getElementById('viewer-ar').style.display = 'block';
    document.getElementById('viewer-3d').style.display = 'none';
    document.getElementById('ar-hint-bar').innerText = '📷 Scan image · ☝️ Drag to rotate · 🤏 Zoom';
    // Hide all AR models
    ['ar-pizza','ar-burger','ar-drink'].forEach(mid => {
        const el = document.getElementById(mid);
        if (el) el.setAttribute('visible','false');
    });
    // Show selected
    const arEl = document.getElementById(menuData[id].arId);
    const scales = { pizza:'0.5 0.5 0.5', burger:'0.3 0.3 0.3', drink:'0.5 0.5 0.5' };
    if (arEl) {
        arEl.setAttribute('visible','true');
        arEl.setAttribute('scale', scales[id] || '0.5 0.5 0.5');
        arEl.setAttribute('rotation','0 0 0');
    }
    arRotX = 0; arRotY = 0;
    arScale = parseFloat((scales[id] || '0.5').split(' ')[0]);
    history.pushState({ page: 'ar' }, '');
}

// ── Close Viewer ──
function closeViewer() {
    currentModel = null; viewerMode = null;
    document.getElementById('viewer-3d').style.display = 'none';
    document.getElementById('viewer-ar').style.display = 'none';
    document.getElementById('ar-topbar').style.display = 'none';
    document.getElementById('ar-bottombar').style.display = 'none';
    document.getElementById('back-btn').classList.remove('visible');
    document.getElementById('menu-page').style.display = 'flex';
    document.getElementById('bottom-nav').style.display = 'flex';
    ['ar-pizza','ar-burger','ar-drink'].forEach(mid => {
        const el = document.getElementById(mid);
        if (el) el.setAttribute('visible','false');
    });
    if (threeControls) threeControls.autoRotate = false;
    updateCartBar();
}

function resetModel() {
    if (viewerMode === '3d' && threeControls) { threeControls.reset(); threeControls.autoRotate = true; }
    if (viewerMode === 'ar') { arRotX = 0; arRotY = 0; const el = document.getElementById(menuData[currentModel]?.arId); if(el) el.setAttribute('rotation','0 0 0'); }
}

// ── Cart ──
function quickAdd(id) { addItemToCart(id,1); showToast('✅', menuData[id].name+' added!', 'Rs. '+menuData[id].price); }
function addToCart() { if(!currentModel)return; addItemToCart(currentModel,arQty); showToast('🛒', menuData[currentModel].name+' × '+arQty+' added!','Rs. '+(menuData[currentModel].price*arQty)); }
function addItemToCart(id,qty) { if(cart[id]) cart[id].qty+=qty; else cart[id]={qty}; updateCartBar(); }
function removeFromCart(id) { if(!cart[id])return; cart[id].qty--; if(cart[id].qty<=0) delete cart[id]; renderCartPage(); updateCartBar(); }
function addFromCart(id) { if(cart[id]) cart[id].qty++; renderCartPage(); updateCartBar(); }
function getCartCount() { return Object.values(cart).reduce((s,v)=>s+v.qty,0); }
function getCartTotal() { return Object.entries(cart).reduce((s,[id,v])=>s+menuData[id].price*v.qty,0); }
function updateCartBar() {
    const n=getCartCount(), t=getCartTotal(), bar=document.getElementById('cart-bar');
    if(n>0){ bar.classList.add('visible'); document.getElementById('cart-count').innerText=n+' item'+(n>1?'s':''); document.getElementById('cart-total').innerText='Rs. '+t; }
    else bar.classList.remove('visible');
}
function changeQty(d) { arQty=Math.max(1,Math.min(10,arQty+d)); document.getElementById('ar-qty-num').innerText=arQty; }
function orderNow() { if(!currentModel)return; addItemToCart(currentModel,arQty); closeViewer(); setTimeout(()=>placeOrder(),300); }
function openCart() { renderCartPage(); document.getElementById('cart-page').classList.add('open'); history.pushState({page:'cart'},''); }
function closeCart() { document.getElementById('cart-page').classList.remove('open'); }
function renderCartPage() {
    const c=document.getElementById('cart-items'), e=document.getElementById('empty-cart'), k=Object.keys(cart);
    if(!k.length){ c.innerHTML=''; e.style.display='flex'; }
    else {
        e.style.display='none';
        c.innerHTML=k.map(id=>{const it=menuData[id],q=cart[id].qty,t=it.price*q; return `<div class="cart-item"><div class="cart-item-icon">${it.icon}</div><div class="cart-item-info"><div class="cart-item-name">${it.name}</div><div class="cart-item-price">Rs. ${it.price} × ${q} = Rs. ${t}</div></div><div class="qty-controls"><button class="qty-btn" onclick="removeFromCart('${id}')">−</button><div class="qty-num">${q}</div><button class="qty-btn" onclick="addFromCart('${id}')">+</button></div></div>`;}).join('');
    }
    const s=getCartTotal(),tax=Math.round(s*0.05);
    document.getElementById('summary-subtotal').innerText='Rs. '+s;
    document.getElementById('summary-tax').innerText='Rs. '+tax;
    document.getElementById('summary-total').innerText='Rs. '+(s+tax);
}
function placeOrder() { if(!getCartCount())return; document.getElementById('order-id-text').innerText='Order #'+Math.floor(1000+Math.random()*9000); cart={}; updateCartBar(); document.getElementById('cart-page').classList.remove('open'); document.getElementById('order-success').classList.add('open'); }
function backToMenu() { document.getElementById('order-success').classList.remove('open'); showMenu(); }
function showMenu() { document.getElementById('menu-page').style.display='flex'; document.getElementById('bottom-nav').style.display='flex'; }
function showToast(icon,msg,sub) { document.getElementById('toast-icon').innerText=icon; document.getElementById('toast-msg').innerText=msg; document.getElementById('toast-sub').innerText=sub; const t=document.getElementById('toast'); t.style.display='block'; setTimeout(()=>t.style.display='none',1800); }

window.addEventListener('popstate',function(){
    if(document.getElementById('viewer-3d').style.display==='block'||document.getElementById('viewer-ar').style.display==='block'){closeViewer();return;}
    if(document.getElementById('cart-page').classList.contains('open')){closeCart();return;}
    if(document.getElementById('order-success').classList.contains('open')){backToMenu();return;}
});
history.pushState({page:'menu'},'');
window.addEventListener('resize',resizeRenderer);

// ── AR Touch Controls ──
let arRotX=0, arRotY=0, arScale=0.5;
const arMinScale=0.1, arMaxScale=4.0;
let arLastX=null, arLastY=null, arLastPinch=null;

function getArEl() { return currentModel ? document.getElementById(menuData[currentModel].arId) : null; }
function getPinchDist(t) { return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }

document.addEventListener('touchstart',e=>{
    if(viewerMode!=='ar') return;
    if(e.target.closest('#ar-bottombar')||e.target.closest('#back-btn')) return;
    if(e.touches.length===1){ arLastX=e.touches[0].clientX; arLastY=e.touches[0].clientY; arLastPinch=null; }
    else if(e.touches.length===2){ arLastPinch=getPinchDist(e.touches); arLastX=null; }
},{passive:true});

document.addEventListener('touchmove',e=>{
    if(viewerMode!=='ar') return;
    if(e.target.closest('#ar-bottombar')||e.target.closest('#back-btn')) return;
    const el=getArEl(); if(!el) return;
    if(e.touches.length===1&&arLastX!==null){
        const dx=e.touches[0].clientX-arLastX, dy=e.touches[0].clientY-arLastY;
        arRotY+=dx; arRotX+=dy;
        el.setAttribute('rotation',`${arRotX} ${arRotY} 0`);
        arLastX=e.touches[0].clientX; arLastY=e.touches[0].clientY;
    } else if(e.touches.length===2&&arLastPinch!==null){
        const nd=getPinchDist(e.touches);
        arScale=Math.min(arMaxScale,Math.max(arMinScale,arScale+(nd-arLastPinch)*0.008));
        el.setAttribute('scale',`${arScale} ${arScale} ${arScale}`);
        arLastPinch=nd;
    }
},{passive:true});

document.addEventListener('touchend',()=>{ arLastX=null; arLastY=null; arLastPinch=null; });
