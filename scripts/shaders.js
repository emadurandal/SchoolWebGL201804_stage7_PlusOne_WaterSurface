function vertexShader() {
  let text = `
    // 頂点シェーダーの計算精度です。頂点シェーダーについては、ほぼこれで大丈夫です。
    precision highp float;

    // attribute変数。JavaScriptで設定した頂点データの受け取り口です。
    attribute vec3 aPosition;
    attribute vec4 aColor;
    attribute vec3 aNormal;
    attribute vec2 aTexcoord;

    // varying変数。フラグメントシェーダーに渡す変数です。
    varying vec4 vColor;
    varying vec3 vPos;
    varying vec3 vNormal;
    varying vec2 vTexcoord;

    // unifomr変数。JavaScript側から渡す、少量の設定データです。
    uniform mat4 uPVWMatrix;
    uniform mat4 uWMatrix;
    uniform float uTime;

    void main(void) {

      // この２つのepsilon変数の値を変えてみると、どうなるでしょう？
      float epsilonX = 0.0;
      float epsilonZ = 0.0;

      // 波の形状の変化スピードの比率です
      float speed = 1.0;

      // 波の最大高さのスケール値です
      float waveHeight = 0.7;

      // Sin関数に与える引数の数値をよい感じ（波の形が円形）になるように作ります。
      vec2 horizontalDir = vec2((aPosition.x - epsilonX), ((aPosition.z) - epsilonZ));
      float horizontalLength = length(horizontalDir);

      // Sin関数で波の形を作ります
      float height = sin(horizontalLength - uTime * speed);
      vec3 pos = vec3(aPosition.x, -height, aPosition.z);

      // 高さを放射状に減衰させます。これをしないと、どこまでも水面の波が続くことになります。
      float mountain = 0.05 * (horizontalLength);
      pos.y = pos.y * max(- (mountain * mountain) + waveHeight, 0.0);

      // 法線を計算します。（どうして以下のベクトル値なのかは、「正弦波 法線」でGoogle検索すると、わかるかも？）
      vec3 norm = normalize(vec3(pos.y,1.0, pos.y));

      // 頂点座標を変換します。（ワールド行列、ビュー行列、プロジェクション行列、とかけているので、投影空間にまで変換。よくやる変換ですね。
      gl_Position = uPVWMatrix * vec4(pos, 1.0);
      // フラグメントシェーダーでも頂点の位置座標を使いたいので、varying変数として計算します。
      // 今回はワールド行列をかけてワールド空間にしたものを渡します。
      vPos = (uWMatrix * vec4(pos, 1.0)).xyz;

      // 本講座で、法線を変換するときは特別なNormal行列が必要と教わったと思います。
      // でも実は、表示しようとする物体の形が変形するような変換をしていなければ、World行列で変換してもかまわないのです。
      vNormal = (uWMatrix * vec4(norm, 1.0)).xyz;

      // テクスチャ座標をフラグメントシェーダーにそのまま渡します。（でも、このテクスチャ座標は結局今回は使いませんでした）
      vTexcoord = aTexcoord;

      // 水色を設定します。
      vColor = vec4(76.0/255.0, 184.0/255.0, 243.0/255.0, 1.0);
      // 中央から離れるほど、色を薄めて透明にします。
      vColor *= clamp(0.0, 1.0, 1.0 - horizontalLength * 0.05);
    }

`;
  
  return text;
}


function fragmentShader() {
  let text = `
    // フラグメントシェーダーの計算精度です。
    precision highp float;

    // varying変数。頂点シェーダーから値が渡ってきた変数で、変数名は対応する頂点シェーダー側の変数と一致する必要があります。
    varying vec3 vPos;
    varying vec4 vColor;
    varying vec3 vNormal;
    varying vec2 vTexcoord;

    // unifomr変数。JavaScript側から渡す、少量の設定データです。
    uniform vec2 uTargetSize;
    uniform sampler2D uTexture;

    void main(void) {
      // 頂点シェーダーから渡ってきたベクトルは、フラグメントシェーダーに来る時点で正規化されていない状態になります。
      // そのため、normalize関数で再び正規化します。
      vec3 waterNormal = normalize(vNormal);

      // 中央の適当な高いところに点光源を配置
      vec3 lightPos = vec3(0.0, 1000.0, 0.0);
      // ライトベクトル（頂点位置ベクトル -> 点光源位置ベクトル）を計算（正規化もします）　
      vec3 lightDir = normalize(lightPos - vPos);

      // ライトベクトルと水面上の点の法線　の内積を計算します。
      // 光は斜めから入ると、地面に照射される面積が増えるため、逆に言うと単位面積あたりの光量が薄まります。
      // この内積によって、その幾何学的な要因による入射光の量の薄まりを考慮しているのです。
      // （つまり、この内積は「マテリアルの特徴とは関係ない」計算要素です）
      // ランバート反射やフォン反射などあらゆる反射の式に、入射光の処理の関係でこの考えが常に出てきます。覚えておこう！
      float dotProduct = dot(lightDir, waterNormal);

      // 以下は、ハーフランバート反射といわれる反射式です。通常のランバート反射よりも光の加減がなだらかになります。
      // 人肌のレンダリングなどで、少ない計算量でやわらかい陰影に見せたいときに、モバイルゲームなどで今でも使われることがあります。
      float diffuse = dotProduct * 0.5 + 0.5;
      float halfLambert = diffuse*diffuse;

      // 頂点シェーダーで計算済みの水面の色を、水面の色として適用します。
      gl_FragColor = vColor;

      // 以下のif文で、水面上のテクスチャを張る範囲を限定しています。
      // （この条件式は、実行しながら試行錯誤の末に行き着いたものだから、理解できなくても気にしない！）
      if (vPos.x > -uTargetSize.x/2.0 && vPos.x < uTargetSize.x/2.0
        && vPos.z > 0.0 && vPos.z < uTargetSize.y)
      {        
        // UV座標は0～1の範囲と決まっているので、その範囲に縮小してあげます。
        vec2 uv = vec2((vPos.x + uTargetSize.x/2.0)/ uTargetSize.x, vPos.z/ uTargetSize.y);

        // テクスチャから取ってきた画像を、水面の色に乗算します。これで、水面に絵が反射しているように見えます。
        gl_FragColor *=  texture2D(uTexture, uv);
      }

    }

`;
  
  return text;
}
