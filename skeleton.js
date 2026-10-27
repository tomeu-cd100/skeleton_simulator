import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

// Joint positions for the right side of the body (x > 0). The left side mirrors x.
const JOINTS = {
    shoulder: [6.6, 27.4, -0.4],
    elbow: [8.3, 17.8, -0.8],
    wrist: [9.2, 9.4, 0.4],
    hipJoint: [3.2, 9.0, 0.3],
    knee: [3.6, -3.2, 0.6],
    ankle: [3.7, -14.6, -0.2],
    toe: [3.9, -16.6, 3.4]
};

// Helper vector; dir = 1 for right side, -1 for left side
const v = (x, y, z, dir = 1) => new THREE.Vector3(x * dir, y, z);
const joint = (key, dir) => v(...JOINTS[key], dir);

// Smooth lathe profile from a list of [radius, height] points
function latheFromProfile(points, segments = 20) {
    const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.LatheGeometry(curve.getPoints(48), segments);
}

// Long bone: thin shaft with wider knobbly ends (epiphysis)
function longBoneGeometry(length, r) {
    const h = length / 2;
    return latheFromProfile([
        [0, -h - r * 0.5],
        [r * 0.85, -h - r * 0.25],
        [r * 1.1, -h + r * 0.35],
        [r * 0.75, -h + r * 1.2],
        [r * 0.45, -h + r * 2.4],
        [r * 0.4, 0],
        [r * 0.45, h - r * 2.4],
        [r * 0.75, h - r * 1.2],
        [r * 1.1, h - r * 0.35],
        [r * 0.85, h + r * 0.25],
        [0, h + r * 0.5]
    ]);
}

// Muscle belly: spindle shape, thick in the middle and thin at the tendons
function spindleGeometry(length, r) {
    const h = length / 2;
    return latheFromProfile([
        [0, -h],
        [r * 0.3, -h * 0.9],
        [r * 0.8, -h * 0.45],
        [r, 0],
        [r * 0.8, h * 0.45],
        [r * 0.3, h * 0.9],
        [0, h]
    ], 24);
}

// Positions and orients a Y-aligned mesh so it spans from a to b
function placeBetween(mesh, a, b) {
    const dir = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
}

export class Skeleton {
    constructor(scene) {
        this.scene = scene;
        this.bones = {}; // Map of boneName -> THREE.Object3D (mesh or group)
        this.muscles = {}; // Map of muscleName -> THREE.Object3D (mesh or group)
        this.pickables = []; // Every mesh that can be hovered/clicked

        this.activeBones = new Set();
        this.activeMuscles = new Set();
        this.hoverName = null;

        this.container = new THREE.Group();
        this.scene.add(this.container);

        this.boneGroup = new THREE.Group();
        this.muscleGroup = new THREE.Group();
        this.container.add(this.boneGroup);
        this.container.add(this.muscleGroup);

        this.materialBoneNormal = new THREE.MeshPhysicalMaterial({
            color: 0xe8dfcc,
            roughness: 0.55,
            metalness: 0.0,
            clearcoat: 0.2,
            clearcoatRoughness: 0.6
        });
        this.materialBoneActive = new THREE.MeshPhysicalMaterial({
            color: 0x38d9ff,
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0x0077cc,
            emissiveIntensity: 0.5,
            clearcoat: 0.6
        });

        // Inactive muscles are almost transparent so the bones stay visible
        this.materialMuscleNormal = new THREE.MeshPhysicalMaterial({
            color: 0xc25a5a,
            roughness: 0.6,
            transparent: true,
            opacity: 0.14,
            depthWrite: false
        });
        this.materialMuscleActive = new THREE.MeshPhysicalMaterial({
            color: 0xff3b3b,
            roughness: 0.35,
            emissive: 0xcc0000,
            emissiveIntensity: 0.5,
            clearcoat: 0.4,
            transparent: true,
            opacity: 0.92
        });

        this.materialHover = new THREE.MeshPhysicalMaterial({
            color: 0xffe066,
            roughness: 0.3,
            emissive: 0xffaa00,
            emissiveIntensity: 0.6
        });
        this.materialDark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });

        this.createSkeleton();
        this.createMuscles();
        this.applyMaterials();
    }

    setSeparation(distance) {
        // Move bones to the left and muscles to the right
        this.boneGroup.position.x = -distance / 2;
        this.muscleGroup.position.x = distance / 2;
    }

    setMusclesVisible(visible) {
        this.muscleGroup.visible = visible;
    }

    // Registers a bone or muscle so it can be highlighted and picked
    register(name, type, object) {
        object.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.userData.part = { name, type };
                this.pickables.push(o);
            }
        });
        if (type === 'bone') {
            this.bones[name] = object;
            this.boneGroup.add(object);
        } else {
            this.muscles[name] = object;
            this.muscleGroup.add(object);
        }
        return object;
    }

    // ---------- Bones ----------

    createSkeleton() {
        // Central Axis
        this.createPelvis();
        this.createSpine();
        this.createRibcage();
        this.createSkull();

        // Legs
        this.createLeg('L', -1);
        this.createLeg('R', 1);

        // Arms
        this.createArm('L', -1);
        this.createArm('R', 1);
    }

    longBone(a, b, r) {
        const length = a.distanceTo(b) * 0.9;
        return placeBetween(new THREE.Mesh(longBoneGeometry(length, r)), a, b);
    }

    createPelvis() {
        const pelvis = new THREE.Group();

        // Pelvic ring (basin)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.6, 12, 32));
        ring.rotation.x = Math.PI / 2 - 0.35;
        ring.scale.set(1.15, 1, 1);
        ring.position.set(0, 8.8, 0.2);
        pelvis.add(ring);

        // Ilium (wings)
        [-1, 1].forEach(dir => {
            const wing = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16));
            wing.scale.set(1, 1.1, 0.28);
            wing.position.set(2.9 * dir, 10.7, -0.5);
            wing.rotation.set(0.2, 0.9 * dir, -0.3 * dir);
            pelvis.add(wing);
        });

        // Sacrum
        const sacrum = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 12));
        sacrum.rotation.x = Math.PI;
        sacrum.position.set(0, 9.6, -1.3);
        pelvis.add(sacrum);

        this.register('hips', 'bone', pelvis);
    }

    createSpine() {
        // Vertebrae with a gentle S-curve, from the sacrum to the neck
        const spine = new THREE.Group();
        const count = 17;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const y = 11.8 + t * 17.2;
            const z = -1.4 + Math.sin(t * Math.PI * 2) * 0.35;
            const size = 0.95 - t * 0.3;

            const body = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.75, 14));
            body.position.set(0, y, z);
            spine.add(body);

            // Spinous process (the bump you can feel on the back)
            const process = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.1));
            process.position.set(0, y - 0.1, z - size - 0.4);
            process.rotation.x = 0.4;
            spine.add(process);
        }
        this.register('spine', 'bone', spine);

        // Cervical vertebrae
        const neck = new THREE.Group();
        for (let i = 0; i < 4; i++) {
            const vertebra = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12));
            vertebra.position.set(0, 29.9 + i * 0.75, -1.0 + i * 0.12);
            neck.add(vertebra);
        }
        this.register('neck', 'bone', neck);
    }

    createRibcage() {
        const ribs = new THREE.Group();

        // Sternum
        const sternum = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6.5, 0.45));
        sternum.position.set(0, 24.6, 2.7);
        sternum.rotation.x = -0.12;
        ribs.add(sternum);

        // Ribs as curved tubes from the spine around to the front
        const pairs = 10;
        for (let i = 0; i < pairs; i++) {
            const y = 27.6 - i * 0.95;
            const width = 3.3 + Math.sin(((i + 1) / (pairs + 2)) * Math.PI) * 1.8;
            const reachesSternum = i < 7;

            [-1, 1].forEach(dir => {
                const points = [
                    v(0.8, y, -1.5, dir),
                    v(width * 0.85, y - 0.4, -1.1, dir),
                    v(width, y - 0.9, 0.4, dir),
                    v(width * 0.75, y - 1.4, 1.9, dir)
                ];
                if (reachesSternum) points.push(v(0.6, 27.0 - i * 0.75, 2.6, dir));

                const curve = new THREE.CatmullRomCurve3(points);
                const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.17, 6));
                ribs.add(rib);
            });
        }
        this.register('ribs', 'bone', ribs);
    }

    createSkull() {
        const skull = new THREE.Group();

        // Cranium
        const cranium = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 24));
        cranium.scale.set(0.88, 1, 1.08);
        cranium.position.set(0, 35.4, -0.4);
        skull.add(cranium);

        // Face
        const face = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 16));
        face.scale.set(0.95, 1.05, 0.8);
        face.position.set(0, 34.2, 0.8);
        skull.add(face);

        // Eye sockets (keep their dark colour when highlighted)
        [-1, 1].forEach(dir => {
            const socket = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), this.materialDark);
            socket.position.set(0.75 * dir, 34.9, 2.05);
            socket.scale.set(1, 0.85, 0.5);
            socket.userData.fixedMaterial = true;
            skull.add(socket);
        });
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 3), this.materialDark);
        nose.position.set(0, 33.9, 2.15);
        nose.rotation.x = Math.PI;
        nose.userData.fixedMaterial = true;
        skull.add(nose);

        // Jaw
        const jaw = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.35, 10, 24, Math.PI));
        jaw.rotation.set(Math.PI / 2 + 0.2, 0, Math.PI);
        jaw.position.set(0, 32.7, 0.7);
        skull.add(jaw);

        this.register('skull', 'bone', skull);
    }

    createLeg(side, dir) {
        const suffix = `_${side}`;
        const hip = joint('hipJoint', dir);
        const knee = joint('knee', dir);
        const ankle = joint('ankle', dir);

        // Femur (with the femoral head that fits into the pelvis)
        const femur = new THREE.Group();
        femur.add(this.longBone(hip, knee, 1.0));
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12));
        head.position.copy(hip).add(v(-0.6, 0.6, 0, dir));
        femur.add(head);
        const kneecap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12));
        kneecap.scale.set(1, 1.1, 0.5);
        kneecap.position.copy(knee).add(new THREE.Vector3(0, 0, 1.1));
        femur.add(kneecap);
        this.register(`femur${suffix}`, 'bone', femur);

        // Tibia
        this.register(`tibia${suffix}`, 'bone', this.longBone(knee, ankle, 0.85));

        // Foot: tarsals block + metatarsals + toes
        const foot = new THREE.Group();
        const heel = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12));
        heel.scale.set(1, 0.8, 1.3);
        heel.position.copy(ankle).add(new THREE.Vector3(0, -1.2, -0.3));
        foot.add(heel);
        for (let i = 0; i < 5; i++) {
            const spread = (i - 2) * 0.32;
            const start = ankle.clone().add(new THREE.Vector3(spread * 0.4 * dir, -1.0, 0.4));
            const end = joint('toe', dir).add(new THREE.Vector3(spread * dir, 0, -Math.abs(i - 1) * 0.25));
            foot.add(this.longBone(start, end, i === 0 ? 0.32 : 0.22));
        }
        this.register(`foot${suffix}`, 'bone', foot);
    }

    createArm(side, dir) {
        const suffix = `_${side}`;
        const shoulder = joint('shoulder', dir);
        const elbow = joint('elbow', dir);
        const wrist = joint('wrist', dir);

        // Clavicle
        this.register(`clavicle${suffix}`, 'bone', this.longBone(v(0.8, 28.3, 2.2, dir), v(6.2, 28.4, -0.2, dir), 0.42));

        // Humerus
        this.register(`humerus${suffix}`, 'bone', this.longBone(shoulder, elbow, 0.85));

        // Radius
        this.register(`radius${suffix}`, 'bone', this.longBone(elbow, wrist, 0.62));

        // Hand: palm + four fingers + thumb
        const hand = new THREE.Group();
        const knuckles = wrist.clone().add(new THREE.Vector3(0.3 * dir, -2.6, 0.3));
        const palm = placeBetween(new THREE.Mesh(spindleGeometry(2.8, 0.8)), wrist, knuckles);
        palm.scale.z = 0.45;
        hand.add(palm);
        for (let i = 0; i < 4; i++) {
            const offset = (i - 1.5) * 0.38;
            const base = knuckles.clone().add(new THREE.Vector3(0, 0, offset));
            const tip = base.clone().add(new THREE.Vector3(0.15 * dir, -2.0 + Math.abs(i - 1.2) * 0.25, offset * 0.3));
            hand.add(this.longBone(base, tip, 0.17));
        }
        const thumbBase = wrist.clone().add(new THREE.Vector3(-0.1 * dir, -0.9, 0.8));
        hand.add(this.longBone(thumbBase, thumbBase.clone().add(new THREE.Vector3(-0.3 * dir, -1.5, 0.8)), 0.2));
        this.register(`hand${suffix}`, 'bone', hand);
    }

    // ---------- Muscles ----------

    // One muscle belly between a and b; flat < 1 makes it thinner front-to-back
    muscleMesh(a, b, r, flat = 1) {
        const mesh = placeBetween(new THREE.Mesh(spindleGeometry(a.distanceTo(b), r)), a, b);
        mesh.scale.z = flat;
        mesh.renderOrder = 1;
        return mesh;
    }

    createMuscle(name, a, b, r, flat) {
        this.register(name, 'muscle', this.muscleMesh(a, b, r, flat));
    }

    // Muscle made of a left and a right half (e.g. pectorals)
    createMusclePair(name, a, b, r, flat) {
        const group = new THREE.Group();
        [-1, 1].forEach(dir => {
            group.add(this.muscleMesh(v(a[0], a[1], a[2], dir), v(b[0], b[1], b[2], dir), r, flat));
        });
        this.register(name, 'muscle', group);
        return group;
    }

    createMuscles() {
        // Upper Body
        this.createMusclePair('pectorals', [0.7, 25.6, 2.6], [5.8, 26.6, 1.1], 1.9, 0.45); // Chest
        this.createMuscle('abdominals', v(0, 21.8, 2.2), v(0, 12.2, 2.3), 2.2, 0.4); // Abs
        const traps = this.createMusclePair('trapezius', [0.4, 30.8, -1.2], [5.9, 27.8, -1.3], 1.4, 0.5); // Traps
        traps.add(this.muscleMesh(v(0, 30, -2.1), v(0, 21.5, -2.3), 1.7, 0.45));
        this.createMusclePair('lower_back', [1.0, 11.6, -2.3], [1.0, 19.5, -2.4], 1.1, 0.7); // Lumbars

        // Arms
        ['L', 'R'].forEach((side, i) => {
            const dir = i === 0 ? -1 : 1;
            this.createMuscle(`latissimus_${side}`, v(1.2, 16.8, -2.3, dir), v(5.7, 24.8, -1.7, dir), 2.0, 0.45); // Lats
            this.createMuscle(`deltoids_${side}`, v(6.0, 28.6, -0.3, dir), v(7.9, 23.4, -0.6, dir), 1.7); // Shoulder
            this.createMuscle(`biceps_${side}`, v(7.1, 25.2, 0.6, dir), v(8.4, 18.4, 0.3, dir), 1.15); // Bicep
            this.createMuscle(`triceps_${side}`, v(6.8, 25.2, -1.6, dir), v(8.2, 18.6, -2.0, dir), 1.15); // Tricep
            this.createMuscle(`forearms_${side}`, v(8.5, 17.2, 0.1, dir), v(9.1, 11.0, 0.5, dir), 1.05); // Forearm
        });

        // Lower Body
        this.createMusclePair('glutes', [2.5, 11.0, -2.1], [3.2, 6.0, -1.9], 2.3, 0.7); // Glutes
        ['L', 'R'].forEach((side, i) => {
            const dir = i === 0 ? -1 : 1;
            this.createMuscle(`quadriceps_${side}`, v(3.1, 8.2, 1.3, dir), v(3.6, -1.6, 1.5, dir), 1.9); // Quad
            this.createMuscle(`hamstrings_${side}`, v(3.2, 7.2, -1.1, dir), v(3.6, -1.8, -0.9, dir), 1.6); // Hamstring
            this.createMuscle(`calves_${side}`, v(3.7, -4.0, -1.0, dir), v(3.7, -11.2, -1.0, dir), 1.35); // Calf
        });
    }

    // ---------- Highlighting ----------

    setPartMaterial(part, material) {
        part.traverse(o => {
            if (o.isMesh && !o.userData.fixedMaterial) o.material = material;
        });
    }

    applyMaterials() {
        Object.entries(this.bones).forEach(([name, bone]) => {
            this.setPartMaterial(bone, this.activeBones.has(name) ? this.materialBoneActive : this.materialBoneNormal);
        });
        Object.entries(this.muscles).forEach(([name, muscle]) => {
            this.setPartMaterial(muscle, this.activeMuscles.has(name) ? this.materialMuscleActive : this.materialMuscleNormal);
        });

        const hovered = this.hoverName && (this.bones[this.hoverName] || this.muscles[this.hoverName]);
        if (hovered) this.setPartMaterial(hovered, this.materialHover);
    }

    highlight(activeBoneNames = [], activeMuscleNames = []) {
        this.activeBones = new Set(activeBoneNames);
        this.activeMuscles = new Set(activeMuscleNames);
        this.applyMaterials();
    }

    setHover(name) {
        if (name === this.hoverName) return;
        this.hoverName = name;
        this.applyMaterials();
    }

    isActive(name) {
        return this.activeBones.has(name) || this.activeMuscles.has(name);
    }

    // Gentle pulse on the active parts
    update(time) {
        const pulse = (Math.sin(time * 0.004) + 1) / 2;
        this.materialMuscleActive.emissiveIntensity = 0.3 + pulse * 0.45;
        this.materialBoneActive.emissiveIntensity = 0.35 + pulse * 0.35;
    }

    // Deprecated, aliased for backward compatibility if needed, but better to use highlight
    highlightBones(activeBoneNames) {
        this.highlight(activeBoneNames, []);
    }
}
