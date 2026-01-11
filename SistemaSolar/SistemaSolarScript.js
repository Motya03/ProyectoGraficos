var gl, program;
var currentRenderMode = 0;


var MaterialTurquoise = {
    mat_ambient: [0.1, 0.1, 0.1],
    mat_diffuse: [0.0, 0.7, 0.7],
    mat_specular: [0.8, 0.8, 0.8],
    alpha: 32.0
};

function setMode(mode) {
    currentRenderMode = mode;

    document.querySelectorAll('button').forEach((b, i) => {
        b.className = (i === mode) ? 'active' : '';
    });
    requestAnimationFrame(drawScene);
}


function getSphereData(radius, latBands, longBands) {
    let vertices = [];
    let indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let long = 0; long <= longBands; long++) {
            let phi = long * 2 * Math.PI / longBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;

            
            vertices.push(radius * x, radius * y, radius * z);
            
            vertices.push(x, y, z);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            let first = (lat * (longBands + 1)) + long;
            let second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    return { vertices: vertices, indices: indices };
}

function getAsteroidRingData(innerRadius, outerRadius, count) {
    let vertices = [];
    let indices = [];

    
    for (let i = 0; i < count; i++) {
        let r = innerRadius + Math.random() * (outerRadius - innerRadius);
        let angle = Math.random() * 2 * Math.PI;
        let x = Math.cos(angle) * r;
        let z = Math.sin(angle) * r;
        let y = (Math.random() - 0.5) * 0.05; 

        let size = 0.005 + Math.random() * 0.01;

        
        let vBase = vertices.length / 6;
        vertices.push(x, y + size, z, 0, 1, 0);
        vertices.push(x - size, y - size, z + size, 0, 1, 0);
        vertices.push(x + size, y - size, z - size, 0, 1, 0);

        indices.push(vBase, vBase + 1, vBase + 2);
    }
    return { vertices: vertices, indices: indices };
}

function getCircleData(segments) {
    let vertices = [];
    for (let i = 0; i < segments; i++) {
        let angle = (i / segments) * 2 * Math.PI;
        vertices.push(Math.cos(angle), 0, Math.sin(angle));
        vertices.push(0, 1, 0); 
    }
    return { vertices: vertices };
}

var exampleCube = getSphereData(1.0, 30, 30);
var ringMesh = getAsteroidRingData(1.3, 2.2, 5000);
var orbitMesh = getCircleData(128);

function getWebGLContext() {
    try { return document.getElementById("myCanvas").getContext("webgl2"); } catch (e) { }
    return null;
}

function initShaders() {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, document.getElementById("myVertexShader").textContent);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, document.getElementById("myFragmentShader").textContent);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
        return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    program.posAttr = gl.getAttribLocation(program, "VertexPosition");
    program.normAttr = gl.getAttribLocation(program, "VertexNormal");
    gl.enableVertexAttribArray(program.posAttr);
    gl.enableVertexAttribArray(program.normAttr);

    program.uModelView = gl.getUniformLocation(program, "modelViewMatrix");
    program.uProjection = gl.getUniformLocation(program, "projectionMatrix");
    program.uNormalMat = gl.getUniformLocation(program, "normalMatrix");


    program.uRenderMode = gl.getUniformLocation(program, "uRenderMode");
    program.uTime = gl.getUniformLocation(program, "uTime");
    program.uIsSun = gl.getUniformLocation(program, "uIsSun");
    program.uTextureType = gl.getUniformLocation(program, "uTextureType");
    program.uBlockerPos = gl.getUniformLocation(program, "uBlockerPos");
    program.uBlockerRadius = gl.getUniformLocation(program, "uBlockerRadius");

    program.uKa = gl.getUniformLocation(program, "Material.Ka");
    program.uKd = gl.getUniformLocation(program, "Material.Kd");
    program.uKs = gl.getUniformLocation(program, "Material.Ks");
    program.uAlpha = gl.getUniformLocation(program, "Material.alpha");

    program.uLa = gl.getUniformLocation(program, "Light.La");
    program.uLd = gl.getUniformLocation(program, "Light.Ld");
    program.uLs = gl.getUniformLocation(program, "Light.Ls");
    program.uLightPos = gl.getUniformLocation(program, "Light.Position");
}

function initBuffers(model) {
    model.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
    model.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
}

function drawSolid(model) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.vertexAttribPointer(program.posAttr, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(program.normAttr, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

function drawLines(model) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.vertexAttribPointer(program.posAttr, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(program.normAttr, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.LINE_LOOP, 0, model.vertices.length / 6);
}



var camPos = [0, 0, 10];
var camYaw = -90;
var camPitch = 0;
var camSpeed = 10.0;


var keys = {};
var drag = false, lastX = 0, lastY = 0;
var isPaused = false;
var showLabels = false;
var totalSimTime = 0;

function handleKeys(deltaTime) {
    const speed = camSpeed * deltaTime;

    
    const yawRad = camYaw * Math.PI / 180;
    const pitchRad = camPitch * Math.PI / 180; 

    
    const front = [
        Math.cos(yawRad) * Math.cos(pitchRad),
        Math.sin(pitchRad),
        Math.sin(yawRad) * Math.cos(pitchRad)
    ];
    
    const len = Math.sqrt(front[0] * front[0] + front[1] * front[1] + front[2] * front[2]);
    front[0] /= len; front[1] /= len; front[2] /= len;

    
    const right = [0, 0, 0];
    vec3.cross(right, front, [0, 1, 0]);
    vec3.normalize(right, right);

    
    if (keys['KeyW']) {
        vec3.scaleAndAdd(camPos, camPos, front, speed);
    }
    
    if (keys['KeyS']) {
        vec3.scaleAndAdd(camPos, camPos, front, -speed);
    }
    
    if (keys['KeyA']) {
        vec3.scaleAndAdd(camPos, camPos, right, -speed);
    }
    
    if (keys['KeyD']) {
        vec3.scaleAndAdd(camPos, camPos, right, speed);
    }
}

function updateUniforms(modelMatrix, time, isSun, textureType, color, blockerPosWorld, blockerRadius) {
    
    const yawRad = camYaw * Math.PI / 180;
    const pitchRad = camPitch * Math.PI / 180;

    const front = [
        Math.cos(yawRad) * Math.cos(pitchRad),
        Math.sin(pitchRad),
        Math.sin(yawRad) * Math.cos(pitchRad)
    ];

    const target = [
        camPos[0] + front[0],
        camPos[1] + front[1],
        camPos[2] + front[2]
    ];

    const view = mat4.create();
    mat4.lookAt(view, camPos, target, [0, 1, 0]);

    const proj = mat4.create();
    mat4.perspective(proj, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 300.0);

    const mv = mat4.create();
    mat4.multiply(mv, view, modelMatrix);

    gl.uniformMatrix4fv(program.uModelView, false, mv);
    gl.uniformMatrix4fv(program.uProjection, false, proj);

    if (program.uTime) gl.uniform1f(program.uTime, time);
    if (program.uIsSun) gl.uniform1i(program.uIsSun, isSun ? 1 : 0);
    if (program.uTextureType) gl.uniform1i(program.uTextureType, textureType);

    const nm = mat3.create();
    mat3.normalFromMat4(nm, mv);
    gl.uniformMatrix3fv(program.uNormalMat, false, nm);

    
    const lightWorldPos = [0.0, 0.0, 0.0];
    const lightViewPos = vec3.create();
    vec3.transformMat4(lightViewPos, lightWorldPos, view);
    gl.uniform3fv(program.uLightPos, lightViewPos);

    
    if (program.uBlockerPos && program.uBlockerRadius) {
        if (blockerPosWorld && blockerRadius > 0.0) {
            const blockerPosView = vec3.create();
            vec3.transformMat4(blockerPosView, blockerPosWorld, view);
            gl.uniform3fv(program.uBlockerPos, blockerPosView);
            gl.uniform1f(program.uBlockerRadius, blockerRadius);
        } else {
            gl.uniform3fv(program.uBlockerPos, [9999.0, 9999.0, 9999.0]);
            gl.uniform1f(program.uBlockerRadius, 0.0);
        }
    }

    if (program.uRenderMode) gl.uniform1i(program.uRenderMode, 0);

    
    gl.uniform3fv(program.uKa, [0.1, 0.1, 0.1]);
    let diff = color ? color : [0.0, 0.7, 0.7];
    gl.uniform3fv(program.uKd, diff);
    gl.uniform3fv(program.uKs, [0.1, 0.1, 0.1]); 
    gl.uniform1f(program.uAlpha, 16.0); 

    gl.uniform3f(program.uLa, 0.08, 0.08, 0.08); 
    gl.uniform3f(program.uLd, 12.0, 12.0, 12.0); 
    gl.uniform3f(program.uLs, 2.0, 2.0, 2.0);    
}



const PLANETS = [
    { name: "Mercurio", dist: 12.0, size: 0.3, speedOrb: 4.15 * 0.4, speedRot: 0.02, type: 3, color: [0.6, 0.6, 0.6], moons: [] },
    { name: "Venus", dist: 16.0, size: 0.6, speedOrb: 1.62 * 0.4, speedRot: -0.01, type: 4, color: [0.9, 0.8, 0.6], moons: [] },
    {
        name: "Tierra", dist: 20.0, size: 0.7, speedOrb: 1.0 * 0.4, speedRot: 1.2, type: 1, color: [0.0, 0.4, 1.0],
        moons: [{ name: "Luna", dist: 1.5, size: 0.2, speed: 2.0, type: 2 }]
    },
    {
        name: "Marte", dist: 26.0, size: 0.4, speedOrb: 0.53 * 0.4, speedRot: 1.15, type: 5, color: [0.8, 0.3, 0.1],
        moons: [
            { name: "Fobos", dist: 0.8, size: 0.08, speed: 4.0, type: 2 },
            { name: "Deimos", dist: 1.2, size: 0.06, speed: 2.5, type: 2 }
        ]
    },
    {
        name: "Júpiter", dist: 40.0, size: 2.5, speedOrb: 0.08 * 0.4, speedRot: 2.9, type: 6, color: [0.9, 0.8, 0.7],
        moons: [
            { name: "Io", dist: 3.5, size: 0.25, speed: 3.0, type: 2 },
            { name: "Europa", dist: 4.5, size: 0.22, speed: 2.2, type: 2 },
            { name: "Ganímedes", dist: 5.5, size: 0.35, speed: 1.5, type: 2 }
        ]
    },
    {
        name: "Saturno", dist: 55.0, size: 2.2, speedOrb: 0.03 * 0.4, speedRot: 2.6, type: 7, color: [0.9, 0.85, 0.6], hasRings: true,
        moons: []
    },
    { name: "Urano", dist: 70.0, size: 1.5, speedOrb: 0.01 * 0.4, speedRot: -1.6, type: 8, color: [0.6, 0.8, 0.9], moons: [] },
    { name: "Neptuno", dist: 85.0, size: 1.5, speedOrb: 0.006 * 0.4, speedRot: 1.8, type: 9, color: [0.2, 0.3, 0.8], moons: [] }
];

var lastTime = 0;
function drawScene(now) {
    if (!now) now = 0;
    if (lastTime === 0) lastTime = now;

    const deltaTime = (now - lastTime) * 0.001;
    lastTime = now;

    
    if (!isPaused) {
        totalSimTime += deltaTime;
    }
    const time = totalSimTime;

    handleKeys(deltaTime);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    const view = mat4.create();
    const proj = mat4.create();
    const yawRad = camYaw * Math.PI / 180;
    const pitchRad = camPitch * Math.PI / 180;
    const front = [Math.cos(yawRad) * Math.cos(pitchRad), Math.sin(pitchRad), Math.sin(yawRad) * Math.cos(pitchRad)];
    const target = [camPos[0] + front[0], camPos[1] + front[1], camPos[2] + front[2]];
    mat4.lookAt(view, camPos, target, [0, 1, 0]);
    mat4.perspective(proj, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 300.0);

    const viewProj = mat4.create();
    mat4.multiply(viewProj, proj, view);

    
    const labelContainer = document.getElementById("labels");
    if (labelContainer) labelContainer.innerHTML = "";

    function drawLabel(worldPos, name) {
        if (!showLabels) return;
        let clipPos = [worldPos[0], worldPos[1], worldPos[2], 1.0];
        let projected = [0, 0, 0, 0];
        projected[0] = viewProj[0] * clipPos[0] + viewProj[4] * clipPos[1] + viewProj[8] * clipPos[2] + viewProj[12] * clipPos[3];
        projected[1] = viewProj[1] * clipPos[0] + viewProj[5] * clipPos[1] + viewProj[9] * clipPos[2] + viewProj[13] * clipPos[3];
        projected[3] = viewProj[3] * clipPos[0] + viewProj[7] * clipPos[1] + viewProj[11] * clipPos[2] + viewProj[15] * clipPos[3];

        if (projected[3] > 0) {
            let ndc = [projected[0] / projected[3], projected[1] / projected[3]];
            let x = (ndc[0] * 0.5 + 0.5) * gl.canvas.clientWidth;
            let y = (ndc[1] * -0.5 + 0.5) * gl.canvas.clientHeight;

            let label = document.createElement("div");
            label.className = "planet-label";
            label.style.left = x + "px";
            label.style.top = (y - 10) + "px";
            label.innerText = name;
            labelContainer.appendChild(label);
        }
    }

    
    
    let mStars = mat4.create();
    mat4.translate(mStars, mStars, camPos);
    mat4.scale(mStars, mStars, [200.0, 200.0, 200.0]);
    updateUniforms(mStars, time, false, 10, [1, 1, 1], null, 0);
    drawSolid(exampleCube);

    
    let mSol = mat4.create();
    mat4.translate(mSol, mSol, [0, 0, 0]);
    mat4.rotateY(mSol, mSol, time * 0.2);
    mat4.scale(mSol, mSol, [8.0, 8.0, 8.0]);
    updateUniforms(mSol, time, true, 0, [1, 1, 0], null, 0);
    drawSolid(exampleCube);
    drawLabel([0, 9, 0], "SOL");

    
    if (showLabels) {
        PLANETS.forEach(p => {
            let mOrbit = mat4.create();
            mat4.scale(mOrbit, mOrbit, [p.dist, 1.0, p.dist]);
            updateUniforms(mOrbit, time, false, 12, [1.0, 1.0, 1.0], null, 0);
            drawLines(orbitMesh);
        });
    }

    
    PLANETS.forEach(p => {
        
        const px = Math.cos(time * p.speedOrb) * p.dist;
        const pz = Math.sin(time * p.speedOrb) * p.dist;
        const worldPos = [px, 0, pz];

        
        let m = mat4.create();
        mat4.translate(m, m, worldPos);
        mat4.rotateY(m, m, time * p.speedRot);
        mat4.scale(m, m, [p.size, p.size, p.size]);

        
        updateUniforms(m, time, false, p.type, p.color, null, 0);
        drawSolid(exampleCube);
        drawLabel([px, p.size + 1.2, pz], p.name.toUpperCase());

        
        if (p.hasRings) {
            let mRings = mat4.create();
            mat4.translate(mRings, mRings, worldPos);
            mat4.rotateY(mRings, mRings, time * 0.5); 
            mat4.scale(mRings, mRings, [p.size, p.size, p.size]);
            updateUniforms(mRings, time, false, 11, [0.8, 0.7, 0.5], null, 0);
            drawSolid(ringMesh);
        }

        
        if (p.moons) {
            p.moons.forEach(moon => {
                let mMoon = mat4.create();
                mat4.translate(mMoon, mMoon, worldPos);
                mat4.rotateY(mMoon, mMoon, time * moon.speed);
                mat4.translate(mMoon, mMoon, [moon.dist, 0, 0]);
                mat4.rotateY(mMoon, mMoon, time * 2.0); 
                mat4.scale(mMoon, mMoon, [moon.size, moon.size, moon.size]);

                
                updateUniforms(mMoon, time, false, moon.type, [0.6, 0.6, 0.6], worldPos, p.size);
                drawSolid(exampleCube);
            });
        }
    });

    requestAnimationFrame(drawScene);
}

function initWebGL() {
    gl = getWebGLContext();
    if (!gl) return;
    gl.enable(gl.DEPTH_TEST);
    initShaders();
    initBuffers(exampleCube);
    ringMesh = getAsteroidRingData(1.3, 2.2, 10000); 
    initBuffers(ringMesh);
    initBuffers(orbitMesh);

    const cvs = gl.canvas;

    
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') isPaused = !isPaused;
        if (e.code === 'KeyR') showLabels = !showLabels;
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    
    cvs.onpointerdown = e => {
        drag = true;
        lastX = e.clientX;
        lastY = e.clientY;
        cvs.setPointerCapture(e.pointerId);
    };
    cvs.onpointerup = e => {
        drag = false;
        cvs.releasePointerCapture(e.pointerId);
    };
    cvs.onpointermove = e => {
        if (!drag) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const sensitivity = 0.2;
        camYaw += dx * sensitivity;
        camPitch -= dy * sensitivity;

        if (camPitch > 89.0) camPitch = 89.0;
        if (camPitch < -89.0) camPitch = -89.0;
    };
    
    cvs.onwheel = e => e.preventDefault();

    requestAnimationFrame(drawScene);
}

window.onload = initWebGL;
