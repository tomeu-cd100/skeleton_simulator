import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Skeleton } from './skeleton.js';
import { ACTIONS } from './actions.js';
import { translateName } from './translations.js';

const FLOOR_Y = -17.4;
const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

class App {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0f17);
        this.scene.fog = new THREE.Fog(0x0b0f17, 80, 170);

        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 14, 82);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#bg'),
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 10, 0);
        this.controls.enableDamping = true;
        this.controls.minDistance = 25;
        this.controls.maxDistance = 150;
        this.controls.maxPolarAngle = Math.PI * 0.56; // Don't go under the floor
        this.controls.update();
        this.controls.saveState();

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.currentAction = null;
        this.lastInteraction = 0;

        this.setupLights();
        this.setupFloor();
        this.skeleton = new Skeleton(this.scene);
        this.initUI();
        this.initPicking();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.onWindowResize();
        this.animate();
    }

    setupLights() {
        const hemiLight = new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 0.9);
        this.scene.add(hemiLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
        mainLight.position.set(15, 45, 25);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(2048, 2048);
        mainLight.shadow.camera.left = -30;
        mainLight.shadow.camera.right = 30;
        mainLight.shadow.camera.top = 45;
        mainLight.shadow.camera.bottom = -25;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        const rimLight = new THREE.DirectionalLight(0x5fa8ff, 1.2);
        rimLight.position.set(-20, 25, -25);
        this.scene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0xffc58a, 0.4);
        fillLight.position.set(-15, 10, 20);
        this.scene.add(fillLight);
    }

    setupFloor() {
        const floor = new THREE.Mesh(
            new THREE.CircleGeometry(400, 64),
            new THREE.MeshStandardMaterial({ color: 0x121826, roughness: 1 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = FLOOR_Y;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Glowing ring under the feet
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(9, 9.25, 64),
            new THREE.MeshBasicMaterial({ color: 0x38d9ff, transparent: true, opacity: 0.35 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = FLOOR_Y + 0.02;
        this.scene.add(ring);
    }

    initUI() {
        const sportContainer = document.getElementById('sport-buttons');
        const dailyContainer = document.getElementById('daily-buttons');
        const separationSlider = document.getElementById('separation');
        const separationValue = document.getElementById('separation-value');
        const musclesToggle = document.getElementById('show-muscles');
        const resetBtn = document.getElementById('reset-btn');
        const panelToggle = document.getElementById('panel-toggle');
        const ui = document.getElementById('ui-container');

        separationSlider.addEventListener('input', (e) => {
            this.skeleton.setSeparation(parseFloat(e.target.value));
            separationValue.textContent = e.target.value;
        });

        musclesToggle.addEventListener('change', (e) => {
            this.skeleton.setMusclesVisible(e.target.checked);
        });

        resetBtn.addEventListener('click', () => {
            this.reset();
        });

        panelToggle.addEventListener('click', () => {
            const collapsed = ui.classList.toggle('collapsed');
            panelToggle.setAttribute('aria-expanded', String(!collapsed));
        });
        ui.addEventListener('transitionend', () => this.onWindowResize());

        Object.values(ACTIONS).forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = 'action-button';
            btn.setAttribute('aria-pressed', 'false');
            btn.addEventListener('click', () => this.selectAction(action, btn));

            if (action.category === 'sport') {
                sportContainer.appendChild(btn);
            } else {
                dailyContainer.appendChild(btn);
            }
        });
    }

    selectAction(action, btn) {
        this.currentAction = action;

        // Highlight logic
        this.skeleton.highlight(action.activeBones, action.activeMuscles || []);

        // UI updates
        document.querySelectorAll('.action-button').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // On mobile, fold the bottom sheet so the model is visible
        if (MOBILE_QUERY.matches) {
            document.getElementById('ui-container').classList.add('collapsed');
            document.getElementById('panel-toggle').setAttribute('aria-expanded', 'false');
        }

        // Update info panel
        document.getElementById('action-title').textContent = action.label;
        const boneList = document.getElementById('bone-list');
        boneList.innerHTML = '';
        boneList.appendChild(this.createPartSection('Ossos', 'bone', action.activeBones));
        if (action.activeMuscles && action.activeMuscles.length > 0) {
            boneList.appendChild(this.createPartSection('Músculs', 'muscle', action.activeMuscles));
        }
    }

    createPartSection(title, type, names) {
        const section = document.createElement('section');
        section.className = `part-section ${type}`;

        const heading = document.createElement('h4');
        heading.textContent = `${title} (${names.length})`;
        section.appendChild(heading);

        const chips = document.createElement('ul');
        chips.className = 'chips';
        names.forEach(name => {
            const li = document.createElement('li');
            li.className = `chip ${type}`;
            li.dataset.name = name;
            li.textContent = translateName(name);
            // Hovering a chip lights up that part in the 3D model
            li.addEventListener('pointerenter', () => this.skeleton.setHover(name));
            li.addEventListener('pointerleave', () => this.skeleton.setHover(null));
            chips.appendChild(li);
        });
        section.appendChild(chips);
        return section;
    }

    // ---------- Hover / click on the 3D model ----------

    initPicking() {
        const canvas = this.renderer.domElement;
        this.tooltip = document.getElementById('tooltip');
        let downPos = null;

        canvas.addEventListener('pointerdown', (e) => {
            downPos = { x: e.clientX, y: e.clientY };
            this.lastInteraction = performance.now();
        });

        canvas.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || e.buttons) return;
            this.showPartAt(e.clientX, e.clientY);
        });

        canvas.addEventListener('pointerleave', () => this.hideTooltip());

        // A tap/click (not a drag) shows the name of the part
        canvas.addEventListener('pointerup', (e) => {
            if (!downPos) return;
            const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
            downPos = null;
            if (moved < 6) this.showPartAt(e.clientX, e.clientY);
        });
    }

    pickPart(x, y) {
        this.pointer.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.skeleton.pickables, false);
        const musclesVisible = this.skeleton.muscleGroup.visible;
        const hit = hits.find(h => h.object.userData.part.type === 'bone' || musclesVisible);
        return hit ? hit.object.userData.part : null;
    }

    showPartAt(x, y) {
        const part = this.pickPart(x, y);
        if (!part) {
            this.hideTooltip();
            return;
        }

        this.skeleton.setHover(part.name);
        this.renderer.domElement.style.cursor = 'pointer';

        const active = this.skeleton.isActive(part.name);
        this.tooltip.innerHTML = '';
        const name = document.createElement('strong');
        name.textContent = translateName(part.name);
        const detail = document.createElement('span');
        detail.className = `tooltip-type ${part.type}`;
        detail.textContent = (part.type === 'bone' ? 'Os' : 'Múscul') + (active ? ' · actiu' : '');
        this.tooltip.append(name, detail);

        const margin = 14;
        this.tooltip.hidden = false;
        const rect = this.tooltip.getBoundingClientRect();
        const left = Math.min(x + margin, window.innerWidth - rect.width - 8);
        const top = Math.max(8, y - rect.height - margin);
        this.tooltip.style.transform = `translate(${left}px, ${top}px)`;

        // Mark the matching chip in the info panel
        document.querySelectorAll('.chip').forEach(c => c.classList.toggle('focus', c.dataset.name === part.name));
    }

    hideTooltip() {
        this.tooltip.hidden = true;
        this.skeleton.setHover(null);
        this.renderer.domElement.style.cursor = '';
        document.querySelectorAll('.chip.focus').forEach(c => c.classList.remove('focus'));
    }

    // ---------- Layout ----------

    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.renderer.setSize(w, h);

        // Keep the model centred in the free space between the panels
        const ui = document.getElementById('ui-container').getBoundingClientRect();
        const info = document.getElementById('info-panel').getBoundingClientRect();
        let offsetX = 0;
        let offsetY = 0;
        let freeW = w;
        let freeH = h;

        if (MOBILE_QUERY.matches) {
            const top = info.bottom;
            const bottom = h - ui.top;
            offsetY = (bottom - top) / 2;
            freeH = h - top - bottom;
        } else {
            const left = ui.right;
            const right = w > 1100 ? w - info.left : 0;
            offsetX = -(left - right) / 2;
            freeW = w - left - right;
        }

        this.camera.setViewOffset(w, h, offsetX, offsetY, w, h);
        this.camera.zoom = Math.max(0.3, Math.min(1, freeH / h, (freeW / w) * 1.5));
        this.camera.updateProjectionMatrix();
    }

    reset() {
        this.currentAction = null;

        // Clear highlights
        this.skeleton.highlight([], []);

        // Reset separation and muscles
        this.skeleton.setSeparation(0);
        document.getElementById('separation').value = 0;
        document.getElementById('separation-value').textContent = '0';
        this.skeleton.setMusclesVisible(true);
        document.getElementById('show-muscles').checked = true;

        // Reset Camera
        this.controls.reset();

        // Reset UI
        document.querySelectorAll('.action-button').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        document.getElementById('action-title').textContent = 'Cap acció seleccionada';
        const boneList = document.getElementById('bone-list');
        boneList.innerHTML = '<p class="placeholder">Tria un esport o una acció per veure quins ossos i músculs treballen.</p>';
        this.hideTooltip();
    }

    animate(time = 0) {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.skeleton.update(time);

        // Simple idle animation, paused for a while after the user interacts
        const delta = time - (this.prevTime ?? time);
        this.prevTime = time;
        if (time - this.lastInteraction > 4000) {
            this.idleTime = (this.idleTime ?? 0) + delta;
            this.skeleton.container.rotation.y = Math.sin(this.idleTime * 0.0004) * 0.25;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new App();
