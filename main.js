import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Skeleton } from './skeleton.js';
import { ACTIONS } from './actions.js';
import { translateName } from './translations.js';

class App {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        this.scene.fog = new THREE.Fog(0x111111, 20, 100);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 60);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#bg'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 20, 0);
        this.controls.update();

        this.setupLights();
        this.skeleton = new Skeleton(this.scene);
        this.initUI();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(10, 50, 20);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x9090ff, 0.5);
        fillLight.position.set(-10, 20, 20);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffaa00, 0.3);
        backLight.position.set(0, 20, -20);
        this.scene.add(backLight);
    }

    initUI() {
        const sportContainer = document.getElementById('sport-buttons');
        const dailyContainer = document.getElementById('daily-buttons');
        const boneList = document.getElementById('bone-list');
        const separationSlider = document.getElementById('separation');
        const resetBtn = document.getElementById('reset-btn');

        separationSlider.addEventListener('input', (e) => {
            this.skeleton.setSeparation(parseFloat(e.target.value));
        });

        resetBtn.addEventListener('click', () => {
            this.reset();
        });

        Object.values(ACTIONS).forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                // Highlight logic
                this.skeleton.highlight(action.activeBones, action.activeMuscles || []);

                // UI updates
                document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update info panel
                boneList.innerHTML = '';

                // Bones Header
                const boneHeader = document.createElement('li');
                boneHeader.innerHTML = '<strong>OSSOS:</strong>';
                boneHeader.style.color = '#00d2ff';
                boneHeader.style.marginTop = '0.5rem';
                boneList.appendChild(boneHeader);

                action.activeBones.forEach(boneName => {
                    const li = document.createElement('li');
                    li.textContent = translateName(boneName);
                    boneList.appendChild(li);
                });

                // Muscles Header
                if (action.activeMuscles && action.activeMuscles.length > 0) {
                    const muscleHeader = document.createElement('li');
                    muscleHeader.innerHTML = '<strong>MÚSCULS:</strong>';
                    muscleHeader.style.color = '#ff4444';
                    muscleHeader.style.marginTop = '1rem';
                    boneList.appendChild(muscleHeader);

                    action.activeMuscles.forEach(muscleName => {
                        const li = document.createElement('li');
                        li.textContent = translateName(muscleName);
                        boneList.appendChild(li);
                    });
                }
            });

            if (action.category === 'sport') {
                sportContainer.appendChild(btn);
            } else {
                dailyContainer.appendChild(btn);
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    reset() {
        // Clear highlights
        this.skeleton.highlight([], []);

        // Reset separation
        this.skeleton.setSeparation(0);
        document.getElementById('separation').value = 0;

        // Reset Camera
        this.controls.reset();

        // Reset UI
        document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        const boneList = document.getElementById('bone-list');
        boneList.innerHTML = '<li class="placeholder">Selecciona una acció...</li>';
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();

        // Simple idle animation for the skeleton container
        this.skeleton.container.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}

new App();
