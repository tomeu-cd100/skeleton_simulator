import * as THREE from 'three';

export class Skeleton {
    constructor(scene) {
        this.scene = scene;
        this.bones = {}; // Map of boneName -> THREE.Mesh
        this.muscles = {}; // Map of muscleName -> THREE.Mesh

        this.container = new THREE.Group();
        this.scene.add(this.container);

        this.boneGroup = new THREE.Group();
        this.muscleGroup = new THREE.Group();
        this.container.add(this.boneGroup);
        this.container.add(this.muscleGroup);

        this.materialBoneNormal = new THREE.MeshPhysicalMaterial({
            color: 0xe3dac9,
            roughness: 0.4,
            metalness: 0.1,
            clearcoat: 0.1,
            clearcoatRoughness: 0.5
        });
        this.materialBoneActive = new THREE.MeshPhysicalMaterial({
            color: 0x00d2ff,
            roughness: 0.2,
            metalness: 0.3,
            emissive: 0x0044aa,
            emissiveIntensity: 0.4,
            clearcoat: 0.5
        });

        this.materialMuscleNormal = new THREE.MeshPhysicalMaterial({
            color: 0xaa4444,
            roughness: 0.5,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.materialMuscleActive = new THREE.MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.3,
            metalness: 0.2,
            emissive: 0xaa0000,
            emissiveIntensity: 0.5,
            transparent: false,
            opacity: 1.0
        });

        this.createSkeleton();
        this.createMuscles();
    }

    setSeparation(distance) {
        // Move bones to the left and muscles to the right
        this.boneGroup.position.x = -distance / 2;
        this.muscleGroup.position.x = distance / 2;
    }

    createMuscle(name, startPos, endPos, thickness) {
        const distance = startPos.distanceTo(endPos);
        const geometry = new THREE.CapsuleGeometry(thickness, distance, 8, 16);
        const muscle = new THREE.Mesh(geometry, this.materialMuscleNormal);

        // Position is midpoint
        const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        muscle.position.copy(midPoint);

        // Orientation
        muscle.lookAt(endPos);
        muscle.rotateX(Math.PI / 2); // Align capsule with lookAt direction

        muscle.userData = { name: name, type: 'muscle' };
        this.muscles[name] = muscle;
        this.muscleGroup.add(muscle);
    }

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

    createPelvis() {
        // Hips as a more complex structure
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, 10, 0);

        // Sacrum (center)
        this.createBoneCustom('hips', 4, 1.5, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, pelvisGroup);

        // Ilium (wings) - approximated with flattened spheres
        const wingGeo = new THREE.SphereGeometry(2.5, 16, 16);
        wingGeo.scale(1, 1.5, 0.5);
        const wingMat = this.materialBoneNormal;

        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(-2.5, 1, 0);
        wingL.rotation.z = 0.2;
        pelvisGroup.add(wingL);

        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(2.5, 1, 0);
        wingR.rotation.z = -0.2;
        pelvisGroup.add(wingR);

        this.boneGroup.add(pelvisGroup);
        // Link 'hips' name to the central bone for highlighting
        // Note: createBoneCustom registers 'hips'
    }

    createSpine() {
        // Spine as individual vertebrae (simplified to 3 segments)
        this.createBoneCustom('spine', 12, 0.8, { x: 0, y: 18, z: 0 }, { x: 0, y: 0, z: 0 });
    }

    createRibcage() {
        const ribGroup = new THREE.Group();
        ribGroup.position.set(0, 24, 0);
        this.boneGroup.add(ribGroup);

        // Sternum
        const sternum = new THREE.Mesh(
            new THREE.BoxGeometry(1, 8, 0.5),
            this.materialBoneNormal
        );
        sternum.position.z = 2.5;
        sternum.userData = { name: 'ribs', type: 'bone' }; // Make sternum clickable/highlightable
        ribGroup.add(sternum);
        this.bones['ribs'] = sternum; // Register sternum as the main 'ribs' object for highlighting logic

        // Ribs (Torus segments)
        for (let i = 0; i < 5; i++) {
            const size = 3 - (i * 0.3);
            const y = 3 - (i * 1.5);

            const ribGeo = new THREE.TorusGeometry(size, 0.15, 8, 16, Math.PI * 1.2);
            const ribL = new THREE.Mesh(ribGeo, this.materialBoneNormal);
            ribL.rotation.y = -2.5;
            ribL.position.set(0, y, 0);
            ribL.userData = { parentName: 'ribs' }; // Mark as child of ribs
            sternum.add(ribL); // Add to sternum so they highlight together via children

            const ribR = new THREE.Mesh(ribGeo, this.materialBoneNormal);
            ribR.rotation.y = 2.5;
            ribR.rotation.z = Math.PI; // Flip for right side
            ribR.position.set(0, y, 0);
            ribR.userData = { parentName: 'ribs' };
            sternum.add(ribR);
        }
    }

    createSkull() {
        const skullGroup = new THREE.Group();
        skullGroup.position.set(0, 33.5, 0);
        this.boneGroup.add(skullGroup);

        // Cranium
        const cranium = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 16, 16),
            this.materialBoneNormal
        );
        cranium.scale.set(1, 1.2, 1);
        cranium.userData = { name: 'skull', type: 'bone' };
        this.bones['skull'] = cranium;
        skullGroup.add(cranium);

        // Jaw
        const jaw = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.5, 2.5),
            this.materialBoneNormal
        );
        jaw.position.set(0, -1.5, 0.5);
        cranium.add(jaw); // Child of cranium

        // Neck
        this.createBoneCustom('neck', 3, 0.8, { x: 0, y: 29.5, z: 0 }, { x: 0, y: 0, z: 0 });
    }

    createLeg(side, dir) {
        const suffix = `_${side}`;
        const xOffset = 3 * dir;

        // Femur
        this.createBoneCustom(`femur${suffix}`, 12, 1.0, { x: xOffset, y: 3, z: 0 }, { x: 0, y: 0, z: 0.1 * -dir });

        // Tibia
        this.createBoneCustom(`tibia${suffix}`, 12, 0.9, { x: xOffset + (1 * dir), y: -9, z: 0 }, { x: 0, y: 0, z: 0 });

        // Foot
        this.createBoneCustom(`foot${suffix}`, 4, 0.8, { x: xOffset + (1 * dir), y: -16, z: 2 }, { x: Math.PI / 2, y: 0, z: 0 });
    }

    createArm(side, dir) {
        const suffix = `_${side}`;
        const xOffset = 5 * dir; // Clavicle start

        // Clavicle
        this.createBoneCustom(`clavicle${suffix}`, 6, 0.6, { x: xOffset, y: 27, z: 0 }, { x: 0, y: 0, z: (Math.PI / 2 - 0.2) * -dir });

        // Humerus
        this.createBoneCustom(`humerus${suffix}`, 10, 0.9, { x: xOffset + (4 * dir), y: 22, z: 0 }, { x: 0, y: 0, z: 0.2 * -dir });

        // Radius
        this.createBoneCustom(`radius${suffix}`, 10, 0.7, { x: xOffset + (5 * dir), y: 12, z: 0 }, { x: 0, y: 0, z: 0.1 * -dir });

        // Hand
        this.createBoneCustom(`hand${suffix}`, 3, 0.8, { x: xOffset + (5.5 * dir), y: 6, z: 0 }, { x: 0, y: 0, z: 0 });
    }

    // Renamed to avoid conflict if needed, or just replace existing
    createBoneCustom(name, height, radius, position, rotation, parent = this.boneGroup) {
        // Bone Shaft (thinner than joints)
        const shaftRadius = radius * 0.6;
        const geometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, height, 16);
        const bone = new THREE.Mesh(geometry, this.materialBoneNormal);

        bone.position.set(position.x, position.y, position.z);
        if (rotation) {
            bone.rotation.set(rotation.x, rotation.y, rotation.z);
        }

        // Joints (Epiphysis)
        const jointGeo = new THREE.SphereGeometry(radius, 16, 16);

        const jointTop = new THREE.Mesh(jointGeo, this.materialBoneNormal);
        jointTop.position.y = height / 2;
        bone.add(jointTop);

        const jointBottom = new THREE.Mesh(jointGeo, this.materialBoneNormal);
        jointBottom.position.y = -height / 2;
        bone.add(jointBottom);

        bone.userData = { name: name, type: 'bone' };
        this.bones[name] = bone;
        parent.add(bone);
        return bone;
    }

    createMuscles() {
        // Helper vectors for positions (approximate based on bone positions)
        const v = (x, y, z) => new THREE.Vector3(x, y, z);

        // Upper Body
        this.createMuscle('pectorals', v(-2, 26, 2), v(2, 26, 2), 2.5); // Chest
        this.createMuscle('abdominals', v(0, 20, 1.5), v(0, 12, 1.5), 2); // Abs
        this.createMuscle('latissimus_L', v(-2, 20, -1), v(-6, 24, -1), 2); // Lats L
        this.createMuscle('latissimus_R', v(2, 20, -1), v(6, 24, -1), 2); // Lats R
        this.createMuscle('trapezius', v(0, 28, -1), v(0, 24, -1), 2.5); // Traps

        // Arms
        this.createMuscle('deltoids_L', v(-6, 27, 0), v(-9, 25, 0), 2.2); // Shoulder L
        this.createMuscle('deltoids_R', v(6, 27, 0), v(9, 25, 0), 2.2); // Shoulder R

        this.createMuscle('biceps_L', v(-9, 24, 0.5), v(-10, 17, 0.5), 1.2); // Bicep L
        this.createMuscle('biceps_R', v(9, 24, 0.5), v(10, 17, 0.5), 1.2); // Bicep R

        this.createMuscle('triceps_L', v(-9, 24, -0.5), v(-10, 17, -0.5), 1.2); // Tricep L
        this.createMuscle('triceps_R', v(9, 24, -0.5), v(10, 17, -0.5), 1.2); // Tricep R

        this.createMuscle('forearms_L', v(-10, 14, 0), v(-10.5, 8, 0), 1); // Forearm L
        this.createMuscle('forearms_R', v(10, 14, 0), v(10.5, 8, 0), 1); // Forearm R

        // Lower Body
        this.createMuscle('glutes', v(0, 10, -2), v(0, 6, -2), 3); // Glutes (simplified center)

        this.createMuscle('quadriceps_L', v(-3, 8, 1), v(-4, -2, 1), 2); // Quad L
        this.createMuscle('quadriceps_R', v(3, 8, 1), v(4, -2, 1), 2); // Quad R

        this.createMuscle('hamstrings_L', v(-3, 8, -1), v(-4, -2, -1), 1.8); // Hamstring L
        this.createMuscle('hamstrings_R', v(3, 8, -1), v(4, -2, -1), 1.8); // Hamstring R

        this.createMuscle('calves_L', v(-4, -5, -1), v(-4, -12, -1), 1.5); // Calf L
        this.createMuscle('calves_R', v(4, -5, -1), v(4, -12, -1), 1.5); // Calf R

        this.createMuscle('lower_back', v(0, 10, -1.5), v(0, 16, -1.5), 2.5); // Lumbars
    }

    highlight(activeBoneNames = [], activeMuscleNames = []) {
        // Reset Bones
        Object.values(this.bones).forEach(bone => {
            bone.material = this.materialBoneNormal;
            bone.children.forEach(child => child.material = this.materialBoneNormal);
        });

        // Reset Muscles
        Object.values(this.muscles).forEach(muscle => {
            muscle.material = this.materialMuscleNormal;
        });

        // Highlight Bones
        activeBoneNames.forEach(name => {
            if (this.bones[name]) {
                this.bones[name].material = this.materialBoneActive;
                this.bones[name].children.forEach(child => child.material = this.materialBoneActive);
            }
        });

        // Highlight Muscles
        activeMuscleNames.forEach(name => {
            if (this.muscles[name]) {
                this.muscles[name].material = this.materialMuscleActive;
            }
        });
    }

    // Deprecated, aliased for backward compatibility if needed, but better to use highlight
    highlightBones(activeBoneNames) {
        this.highlight(activeBoneNames, []);
    }
}
