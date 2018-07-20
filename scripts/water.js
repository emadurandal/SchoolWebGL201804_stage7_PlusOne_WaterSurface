function createWaterGeom( width, height, uSpan, vSpan, isUVRepeat = false) {
  var positions = [];

  for(let i=0; i<=vSpan; i++) {
    for(let j=0; j<=uSpan; j++) {
      positions.push((j/uSpan - 1/2)*width);
      positions.push(0);
      positions.push((i/vSpan - 1/2)*height);
    }
  }

  var indices = [];
  for(let i=0; i<vSpan; i++) {
    let degenerate_left_index = 0;
    let degenerate_right_index = 0;
    for(let j=0; j<=uSpan; j++) {
      indices.push(i*(uSpan+1)+j);
      indices.push((i+1)*(uSpan+1)+j);
      if (j === 0) {
        degenerate_left_index = (i + 1) * (uSpan+1) + j;
      } else if (j === uSpan) {
        degenerate_right_index = (i + 1) * (uSpan+1) + j;
      }
    }
    indices.push(degenerate_right_index);
    indices.push(degenerate_left_index);
  }

  var colors = [];
  for(let i=0; i<=vSpan; i++) {
    for(let j=0; j<=uSpan; j++) {
      colors.push(1);
      colors.push(1);
      colors.push(1);
      colors.push(1);
    }
  }

  var texcoords = [];
  for(let i=0; i<=vSpan; i++) {
    for(let j=0; j<=uSpan; j++) {
      if (isUVRepeat) {
        texcoords.push(j);
        texcoords.push(i);
      } else {
        texcoords.push(j/uSpan);
        texcoords.push(i/vSpan);
      }
    }
  }

  var normals = [];
  for(let i=0; i<=vSpan; i++) {
    for(let j=0; j<=uSpan; j++) {
      normals.push(0);
      normals.push(1);
      normals.push(0);
    }
  }


  var vertices = {
    position: positions,
    color: colors,
    texcoord: texcoords,
    normal: normals
  };
  
  var components = {
    positionComponents: 3,
    colorComponents: 4,
    texcoordComponents: 2,
    normalComponents: 3
  };
  

  return [vertices, components, indices];
}

