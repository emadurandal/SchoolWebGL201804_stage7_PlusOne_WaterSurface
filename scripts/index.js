(function() {
  let gl = null;
  let attribLocationPosition = null;
  let attribLocationColor = null;
  let attribLocationTexcoord = null;
  let attribLocationNormal = null;
  let targetDomAspect = null;
  let waterSize = 70;
  let targetWidthIn3d = 18;
  let reflectScale = 2.5;
  const targetDom = document.getElementById("targetImg");
  
  function webglInit() {
    const resolutionWidth = 512;
    const resolutionHeight = 256;

    const canvas = glTips.createCanvas(
      "world",
      resolutionWidth,
      resolutionHeight
    );

    const targetDom = moveCanvasToTarget(canvas, "targetImg");
    
    targetDomAspect = targetDom.clientWidth / targetDom.clientHeight;

    gl = glTips.getWebGL1Context(canvas);
    if (gl) {
      console.log("WebGL1 context was created successfully.");
    }
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
  }
  
  function initVertexBuffers(attributes, attributeComponents, indices)
  {
    // create VBO
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // convert separeted vertex attribute arrays to a interleaved array
    var typedArray = glTips.makeVerticesDataInterleaved(gl.FLOAT,
      attributes,
      attributeComponents
    )

    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribLocationPosition, 3, gl.FLOAT, gl.FALSE, 48, 0)
    gl.vertexAttribPointer(attribLocationColor, 4, gl.FLOAT, gl.FALSE, 48, 12)
    gl.vertexAttribPointer(attribLocationTexcoord, 2, gl.FLOAT, gl.FALSE, 48, 28)
    gl.vertexAttribPointer(attribLocationNormal, 3, gl.FLOAT, gl.FALSE, 48, 36)

//    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    g_ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  
  function initShader() {
    var vertShaderText = vertexShader();
    var fragShaderText = fragmentShader();
    shaderProgram = glTips.setupShaderProgramFromSource(gl, vertShaderText, fragShaderText);

    attribLocationPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(attribLocationPosition);
    attribLocationColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(attribLocationColor);
    attribLocationTexcoord = gl.getAttribLocation(shaderProgram, "aTexcoord");
    gl.enableVertexAttribArray(attribLocationTexcoord);
    attribLocationNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    gl.enableVertexAttribArray(attribLocationNormal);

    uniformLocationTargetSize = gl.getUniformLocation(shaderProgram, 'uTargetSize');

    uniformLocationTime = gl.getUniformLocation(shaderProgram, 'uTime');
    var uniformTextureSampler_0 = gl.getUniformLocation(shaderProgram, 'uTexture');    
    gl.useProgram(shaderProgram);
    
    gl.uniform1i(uniformTextureSampler_0, 0);
  }
  
  var rotation = 0.0;
  function initMatrix() {
    var viewMat = mat4.create();
    mat4.lookAt(viewMat, vec3.fromValues(0, 25, 50), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

    var worldMat = mat4.create();
    mat4.rotateY(worldMat, worldMat, rotation);
//    rotation += 0.001;

    var projMat = mat4.create();
    mat4.perspective(projMat, Math.PI / 4, 1, 0.1, 10000);
//    mat4.ortho(projMat, -waterSize/2, waterSize/2, -waterSize, waterSize, -waterSize, waterSize);

    var pvwMat = mat4.create();
    mat4.mul(pvwMat, viewMat, worldMat);
    mat4.mul(pvwMat, projMat, pvwMat);
////    console.log(pvwMat)

    uniformLocationPVWMatrix = gl.getUniformLocation(shaderProgram, 'uPVWMatrix');
    gl.uniformMatrix4fv(uniformLocationPVWMatrix, false, pvwMat);
    uniformLocationWMatrix = gl.getUniformLocation(shaderProgram, 'uWMatrix');
    gl.uniformMatrix4fv(uniformLocationWMatrix, false, worldMat);
  }
  
  let texture = null;
  function initTexture() {
    texture = glTips.setupTexture2DSimple(gl, targetDom, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,  gl.LINEAR,  gl.CLAMP_TO_EDGE, false)    
  }

  
  let vertices, components, indices;
  var lastTime = Date.now()
  function render(){
    gl.enable(gl.DEPTH_TEST);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initMatrix();
    gl.uniform1f(uniformLocationTime, (Date.now() - lastTime)*0.003);
    
    gl.drawElements(gl.TRIANGLE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame( render );

  }
    
  webglInit();
  [vertices, components, indices] = createWaterGeom(waterSize, waterSize, 100, 100);
  console.log(vertices, components, indices);

  initShader();
  initVertexBuffers(
    [vertices.position, vertices.color, vertices.texcoord, vertices.normal],
    [components.positionComponents, components.colorComponents, components.texcoordComponents, components.normalComponents],
    indices
  );
  initTexture();
  gl.uniform2f(uniformLocationTargetSize, targetWidthIn3d, targetWidthIn3d/targetDomAspect*reflectScale);

  render();
})();
