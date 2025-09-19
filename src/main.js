// Función para manejar la transición de imágenes
function handleTransition() {
  const transitionScreen = document.getElementById('transition-screen');
  const nikeLogo = document.getElementById('nike-logo');
  const dragonFont = document.getElementById('dragon-font');

  // Mostrar el logo de Nike con fade in
  nikeLogo.classList.add('active');

  // Esperar 1.5 segundos y luego hacer fade out
  setTimeout(() => {
    nikeLogo.classList.remove('active');
    nikeLogo.classList.add('hide');

    // Cambiar a la imagen de dragonFont con fade in
    setTimeout(() => {
      dragonFont.classList.add('active');

      // Esperar 2 segundos y luego hacer fade out de dragonFont
      setTimeout(() => {
        dragonFont.classList.remove('active');
        dragonFont.classList.add('hide');

        // Esperar 1 segundo y luego hacer fade out del fondo negro
        setTimeout(() => {
          transitionScreen.classList.add('hide');
          setTimeout(() => {
            transitionScreen.style.display = 'none';
          }, 1000); // Tiempo igual a la duración de la transición en CSS
        }, 1000); // Esperar 1 segundo después de que dragonFont desaparezca
      }, 2000); // Mostrar dragonFont por 2 segundos
    }, 500); // Tiempo para el cambio a dragonFont
  }, 1500); // Mostrar logo de Nike por 1.5 segundos
}

// Ejecutar la transición inmediatamente
document.addEventListener('DOMContentLoaded', () => {
  handleTransition();
});

// Resto del código para el vestidor 3D
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FocusShader } from 'three/examples/jsm/shaders/FocusShader.js';

// 1. Configuración básica de la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);

// 2. Obtener el contenedor de la escena y configurar la cámara
const vestidorScene = document.getElementById('vestidor-scene');
const camera = new THREE.PerspectiveCamera(
  50,
  vestidorScene.clientWidth / vestidorScene.clientHeight,
  0.1,
  1000
);

// Posición inicial de la cámara para vista general
camera.position.set(0, 0.5, 2.5);

// 3. Configuración del renderizador con sombras
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('vestidor-scene').appendChild(renderer.domElement);

// Configuración del EffectComposer para el efecto de blur
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Configuración del shader de enfoque
const focusShader = new ShaderPass(FocusShader);
focusShader.uniforms.screenWidth.value = vestidorScene.clientWidth;
focusShader.uniforms.screenHeight.value = vestidorScene.clientHeight;
composer.addPass(focusShader);

// 4. Añadir luces a la escena con sombras
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Luz adicional para mejorar las sombras
const hemilight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
scene.add(hemilight);

// 5. Cargar el avatar
const loader = new GLTFLoader();
let avatar = null;
let currentAvatar = 1;
let currentClothes = {};

// Función para cargar un avatar
function cargarAvatar(modelPath) {
  if (avatar) {
    scene.remove(avatar);
  }

  loader.load(
    modelPath,
    (gltf) => {
      avatar = gltf.scene;
      avatar.scale.set(0.7, 0.7, 0.7);
      avatar.position.set(0, -0.68, 0);
      avatar.rotation.y = Math.PI / -5;

      // Habilitar sombras para el avatar
      avatar.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(avatar);
      camera.lookAt(0, 0, 0);

      // Si hay ropa cargada, ajustarla al nuevo avatar
      for (const [key, clothing] of Object.entries(currentClothes)) {
        if (clothing) {
          attachClothing(clothing, avatar);
        }
      }
    },
    undefined,
    (error) => {
      console.error('Error al cargar el avatar:', error);
    }
  );
}

// Función para cargar y adjuntar ropa al avatar
function cargarPrenda(modelPath, type) {
  loader.load(
    modelPath,
    (gltf) => {
      const clothing = gltf.scene;

      // Habilitar sombras para la ropa
      clothing.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Si ya hay una prenda del mismo tipo, eliminarla
      if (currentClothes[type]) {
        scene.remove(currentClothes[type]);
      }

      // Adjuntar la nueva prenda al avatar
      attachClothing(clothing, avatar);
      currentClothes[type] = clothing;

      // Cerrar el menú desplegable después de seleccionar una prenda
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('open');
      });
    },
    undefined,
    (error) => {
      console.error(`Error al cargar la prenda ${type}:`, error);
    }
  );
}

// Función para adjuntar ropa al esqueleto del avatar
function attachClothing(clothing, avatar) {
  if (!avatar) {
    console.error('No hay avatar cargado');
    return;
  }

  // Buscar el esqueleto del avatar
  let avatarSkeleton = null;
  avatar.traverse((child) => {
    if (child.isSkinnedMesh) {
      avatarSkeleton = child.skeleton;
    }
  });

  if (!avatarSkeleton) {
    console.error('No se encontró un esqueleto en el avatar');
    return;
  }

  // Aplicar el esqueleto del avatar a la ropa
  clothing.traverse((clothingChild) => {
    if (clothingChild.isSkinnedMesh) {
      clothingChild.bind(avatarSkeleton, clothingChild.matrixWorld);
    }
  });

  scene.add(clothing);
}

// Cargar el primer avatar
cargarAvatar('/models/avatar_base.glb');

// 6. Configurar controles de órbita con límites
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 2.5;

// 7. Función para enfocar en una parte específica del avatar
function focusOn(part, circle) {
  let targetPosition;
  let cameraPosition;
  let zoomLevel;

  switch (part) {
    case 'head':
      targetPosition = { x: 0, y: 0.5, z: 0 };
      cameraPosition = { x: 0, y: 0.8, z: 1.5 };
      zoomLevel = 1.5;
      break;
    case 'chest':
      targetPosition = { x: 0, y: 0, z: 0 };
      cameraPosition = { x: 0, y: 0.3, z: 1.5 };
      zoomLevel = 1.5;
      break;
    case 'legs':
      targetPosition = { x: 0, y: -0.8, z: 0 };
      cameraPosition = { x: 0, y: -0.5, z: 1.5 };
      zoomLevel = 1.5;
      break;
    case 'reset':
      targetPosition = { x: 0, y: 0, z: 0 };
      cameraPosition = { x: 0, y: 0.5, z: 2.5 };
      zoomLevel = 2.5;
      break;
  }

  // Animación para mover la cámara suavemente
  new TWEEN.Tween(camera.position)
    .to(cameraPosition, 1000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  new TWEEN.Tween(controls.target)
    .to(targetPosition, 1000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  controls.minDistance = zoomLevel;
  controls.maxDistance = zoomLevel;

  // Aplicar efecto de blur
  if (part !== 'reset') {
    focusShader.uniforms.sampleDistance.value = 0.5;
    focusShader.uniforms.waveFactor.value = 0;
  } else {
    focusShader.uniforms.sampleDistance.value = 0;
    focusShader.uniforms.waveFactor.value = 0;
  }

  // Escalar el círculo seleccionado
  document.querySelectorAll('.circle').forEach(c => {
    if (c === circle) {
      c.style.transform = 'translateX(-50%) scale(1.5)';
      c.style.opacity = '1';
    } else {
      c.style.transform = 'translateX(-50%) scale(1)';
      c.style.opacity = '0';
    }
  });
}

// 8. Eventos para las miniaturas de ropa
document.querySelectorAll('.ropa-item').forEach(item => {
  item.addEventListener('click', () => {
    const modelPath = item.getAttribute('data-model');
    const type = item.getAttribute('data-type');
    cargarPrenda(modelPath, type);
  });
});

// 9. Evento para cambiar de avatar
document.getElementById('change-avatar').addEventListener('click', () => {
  if (currentAvatar === 1) {
    cargarAvatar('/models/avatar_base2.glb');
    currentAvatar = 2;
  } else {
    cargarAvatar('/models/avatar_base.glb');
    currentAvatar = 1;
  }
});

// 10. Eventos para los círculos clickeables
document.querySelectorAll('.circle').forEach(circle => {
  circle.addEventListener('click', (e) => {
    e.stopPropagation();
    const category = circle.getAttribute('data-category');
    const menu = document.querySelector(`.${category}-menu`);

    // Cerrar todos los menús
    document.querySelectorAll('.dropdown-menu').forEach(m => {
      m.classList.remove('open');
    });

    // Abrir el menú seleccionado
    menu.classList.add('open');

    // Hacer zoom a la parte seleccionada
    focusOn(category, circle);
  });
});

// 11. Cerrar menús al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.circle') && !e.target.closest('.dropdown-menu')) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('open');
    });

    // Resetear la vista y los círculos
    focusOn('reset');
    document.querySelectorAll('.circle').forEach(c => {
      c.style.transform = '';
      c.style.opacity = '1';
    });
  }
});

// 12. Ajustar al redimensionar la ventana
window.addEventListener('resize', () => {
  camera.aspect = vestidorScene.clientWidth / vestidorScene.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
  composer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
  focusShader.uniforms.screenWidth.value = vestidorScene.clientWidth;
  focusShader.uniforms.screenHeight.value = vestidorScene.clientHeight;
});

// 13. Animación principal
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  composer.render();
}
animate();
