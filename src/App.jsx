import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TWEEN } from "https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import loadingImage from "./assets/logo.png";

function App() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("black");

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById("root").appendChild(renderer.domElement);
    camera.position.set(0, 5, 50);

    document.body.style.touchAction = "none";

    window.addEventListener("resize", onWindowResize);

    const control = new OrbitControls(camera, renderer.domElement);
    control.enableDamping = true;
    control.minDistance = 5;
    control.maxDistance = 100;
    control.enablePan = false;
    control.maxPolarAngle = Math.PI / 2 - 0.05;
    control.update();

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    const sprite = new THREE.TextureLoader().load("/textures/disc.png");
    sprite.colorSpace = THREE.SRGBColorSpace;

    for (let i = 0; i < 100; i++) {
      const x = 200 * Math.random() - 100;
      const y = 7;
      const z = 200 * Math.random() - 100;

      vertices.push(x, y, z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 0.7,
      sizeAttenuation: true,
      map: sprite,
      alphaTest: 0.1,
      transparent: true,
    });
    material.color.setHSL(0.1667, 1.0, 0.5, THREE.SRGBColorSpace);

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const particles2 = particles.clone();
    scene.add(particles2);
    particles2.position.y = 70;
    particles2.scale.set(3, 3, 3);

    const loaddingManager = new THREE.LoadingManager();

    const loadingProgress = document.querySelector(".loading-image");
    const loading = document.querySelector(".loading");
    loaddingManager.onProgress = function (url, loaded, total) {
      const value = (loaded / total) * 100;
      loadingProgress.style.transform = `translateY(${-value}%)`;

      if (value === 100) {
        new Promise((resole) => {
          setTimeout(() => {
            loading.style.display = "none";
            setTimeout(() => {
              resole(true);
            }, 100);
          }, 500);
        }).then(() => {
          animationRotation();
        });
      }
    };

    const gltfLoader = new GLTFLoader(loaddingManager);
    let player;
    gltfLoader.load("/models/lotus_flower_yellow.glb", (gltf) => {
      const model = gltf.scene;
      player = model;
      model.traverse((obj) => {
        if (obj.isMesh) obj.castShadow = true;
      });
      scene.add(model);
      model.scale.set(100, 100, 100);
    });

    let mixer;
    gltfLoader.load("/models/bird.glb", (gltf) => {
      const model = gltf.scene;
      model.traverse((obj) => {
        if (obj.isMesh) obj.castShadow = true;
      });
      mixer = new THREE.AnimationMixer(model);
      const clips = gltf.animations;
      clips.forEach(function (clips) {
        const action = mixer.clipAction(clips);
        action.play();
      });
      scene.add(model);
      model.scale.set(10, 10, 10);
      model.position.z = -1500;
      model.position.x = -60;
    });

    gltfLoader.load("/models/senOnly.glb", (gltf) => {
      const model = gltf.scene;
      model.scale.set(10, 10, 10);

      const radiusInner = 2;
      const radiusOuter = 3;
      const minDistance = 1;

      for (let i = 0; i < 50; i++) {
        const clone = model.clone();

        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius =
          Math.random() * (radiusOuter - radiusInner) + radiusInner;
        const distance = minDistance + clone.scale.x * 2;

        const x = Math.cos(randomAngle) * randomRadius * distance;
        const z = Math.sin(randomAngle) * randomRadius * distance;

        clone.position.set(x, 0, z);
        scene.add(clone);
      }
    });

    gltfLoader.load("/models/mountain.glb", (gltf) => {
      const stone = gltf.scene;
      stone.scale.set(40, 25, 40);

      const radiusInner = 25;
      const radiusOuter = 60;
      const minDistance = 1;

      for (let i = 0; i < 10; i++) {
        const clone = stone.clone();

        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius =
          Math.random() * (radiusOuter - radiusInner) + radiusInner;
        const distance = minDistance + clone.scale.x * 2;

        const x = Math.cos(randomAngle) * randomRadius * distance;
        const z = Math.sin(randomAngle) * randomRadius * distance;

        clone.position.set(x, 0, z);
        scene.add(clone);
      }
    });

    //Sun
    const sun = new THREE.Vector3();
    // Water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: "#336600",
      distortionScale: 3.7,
    });

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 100, 0);
    scene.add(spotLight);

    water.rotation.x = -Math.PI / 2;
    // Skybox
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(water);
    scene.add(sky);

    const parameters = {
      elevation: -2,
      azimuth: 180,
      count: 2,
    };
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let renderTarget;

    function updateSun({ elevation, azimuth, count }, isMoon = false) {
      const skyUniforms = sky.material.uniforms;
      skyUniforms["turbidity"].value = 10;
      skyUniforms["rayleigh"].value = count;
      skyUniforms["mieCoefficient"].value = 0.005;
      skyUniforms["mieDirectionalG"].value = 0.8;

      if (isMoon) {
        skyUniforms["rayleigh"].value = 0;
        skyUniforms["mieCoefficient"].value = 0.00001;
      }

      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);

      sun.setFromSphericalCoords(1, phi, theta);

      sky.material.uniforms["sunPosition"].value.copy(sun);
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();

      if (renderTarget !== undefined) renderTarget.dispose();

      renderTarget = pmremGenerator.fromScene(sky);
      scene.environment = renderTarget.texture;
    }

    let timer, timer2;

    const clock = new THREE.Clock();

    // Animation loop
    animate();

    document.getElementById("switcher").addEventListener("click", toggleMode);
    function toggleMode() {
      if (document.getElementById("main").classList.contains("night")) {
        if (timer || timer2) {
          clearInterval(timer);
          clearInterval(timer2);

          // Vị trí mới của camera
          var endPosition1 = new THREE.Vector3(0, 100, 0);

          // Thời gian di chuyển (tính bằng giây)
          var duration1 = 3;
          // Tạo tween để di chuyển camera
          new TWEEN.Tween(spotLight.position)
            .to(endPosition1, duration1 * 1000) // Đặt vị trí mới và thời gian di chuyển
            .easing(TWEEN.Easing.Quadratic.InOut) // Áp dụng hàm easing để tạo hiệu ứng mượt mà
            .start(); // Bắt đầu tween
        }
        document.getElementById("main").classList.remove("night");
        animationRotation();
      } else {
        if (timer || timer2) {
          clearInterval(timer);
          clearInterval(timer2);

          // Vị trí mới của camera
          var endPosition = new THREE.Vector3(0, 28, 0);

          // Thời gian di chuyển (tính bằng giây)
          var duration = 3;

          // Tạo tween để di chuyển camera
          new TWEEN.Tween(spotLight.position)
            .to(endPosition, duration * 1000) // Đặt vị trí mới và thời gian di chuyển
            .easing(TWEEN.Easing.Quadratic.InOut) // Áp dụng hàm easing để tạo hiệu ứng mượt mà
            .start(); // Bắt đầu tween
        }
        document.getElementById("main").classList.add("night");

        animationRotation(true);
      }
    }

    function animationRotation(isRevert = false) {
      let vetor = new THREE.Vector3(0, 30, 100);
      if (isRevert) {
        particles.visible = true;
        particles2.visible = true;
        let isDone = false;
        vetor = new THREE.Vector3(100, 50, -100);
        timer = setInterval(() => {
          if (parameters.elevation <= -2) {
            isDone = true;
            clearInterval(timer);
            return;
          }

          parameters.elevation -= 0.1;
          parameters.count -= 0.01;
          updateSun(parameters);
        }, 50);

        timer2 = setInterval(() => {
          if (parameters.elevation > 7) {
            clearInterval(timer2);
            return;
          }

          if (isDone) {
            parameters.azimuth = -45;
            parameters.elevation += 0.1;
            updateSun(parameters, true);
          }
        }, 20);
      } else {
        particles.visible = false;
        particles2.visible = false;
        let isDone = false;
        timer2 = setInterval(() => {
          if (parameters.elevation < -2) {
            isDone = true;
            parameters.azimuth = 180;
            clearInterval(timer2);
            return;
          }

          parameters.elevation -= 0.1;
          updateSun(parameters, true);
        }, 20);

        timer = setInterval(() => {
          if (isDone) {
            if (parameters.elevation >= 2) {
              parameters.elevation = 2;
              updateSun(parameters);
              clearInterval(timer);
              return;
            }
            parameters.elevation += 0.1;
            parameters.count += 0.01;

            updateSun(parameters);
          }
        }, 50);
      }

      // Vị trí mới của camera
      var endPosition = vetor;

      // Thời gian di chuyển (tính bằng giây)
      var duration = 3;

      // Tạo tween để di chuyển camera
      new TWEEN.Tween(camera.position)
        .to(endPosition, duration * 1000) // Đặt vị trí mới và thời gian di chuyển
        .easing(TWEEN.Easing.Quadratic.InOut) // Áp dụng hàm easing để tạo hiệu ứng mượt mà
        .start(); // Bắt đầu tween
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animate);
    };

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
      const time = performance.now() * 0.005;

      if (player) {
        player.position.y = Math.sin(time) * 0.2 + 9.9;

        player.rotation.y += 0.0005;
        particles.rotation.y += 0.001;
        particles2.rotation.y += 0.0005;
      }
      // player.rotation.x = time * 0.01;
      // player.rotation.z = time * 0.01;

      water.material.uniforms["time"].value += 1.0 / 60.0;

      TWEEN.update();

      control.update();
    }
  }, []);

  return (
    <>
      {<div ref={sceneRef}></div>}
      <main id="main">
        <div className="container">
          <div className="switcher-wrapper">
            <p className="mode light">Sun</p>
            <div id="switcher">
              <div className="star star1"></div>
              <div className="star star2"></div>
              <div className="star star3"></div>
              <div className="round-btn">
                <div className="moon-mode"></div>
              </div>
            </div>
            <p className="mode dark">Moon</p>
          </div>
        </div>
      </main>

      <div className="loading">
        <div className="content">
          <div className="loading-image"></div>
          <img src={loadingImage} alt="image-loading" />
        </div>
      </div>
    </>
  );
}

export default App;
