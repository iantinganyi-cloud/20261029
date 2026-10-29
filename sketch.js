<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>p5.js 角色精靈互動動畫</title>
  <!-- 載入 p5.js 核心庫 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <style>
    /* 移除邊距與捲軸，確保全螢幕顯示 */
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #f0ebd8;
      font-family: sans-serif;
    }
    canvas {
      display: block;
    }
    /* 自訂圖片上傳控制項 UI */
    #upload-container {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      background: rgba(255, 255, 255, 0.85);
      padding: 10px 20px;
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #file-input {
      display: none;
    }
    .upload-btn {
      background-color: #e63946;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
    }
    .upload-btn:hover {
      background-color: #d62828;
    }
  </style>
</head>
<body>
  <!-- 允許使用者手動載入本機 1/walk/waik.png 精靈圖 -->
  <div id="upload-container">
    <span style="font-size: 14px; color: #1d3557; font-weight: bold;">載入本機精靈圖 (1/walk/waik.png)：</span>
    <label for="file-input" class="upload-btn">選擇檔案</label>
    <input type="file" id="file-input" accept="image/*">
  </div>

  <script>
    // ------------------------------------------------------------------
    // sketch.js 內容整合（專案以單一檔案執行與展示）
    // ------------------------------------------------------------------

    // 宣告全域變數
    let spriteImage;          // 儲存載入的精靈圖片
    let isImageLoaded = false; // 標記圖片是否成功載入
    
    // 精靈圖片規格設定
    const TOTAL_FRAMES = 9;   // 精靈圖總幀數 (9張圖片)
    const SPRITE_WIDTH = 1246; // 精靈圖總寬度 (1246px)
    const SPRITE_HEIGHT = 198; // 精靈圖總高度 (198px)
    const FRAME_WIDTH = SPRITE_WIDTH / TOTAL_FRAMES; // 單一幀寬度 (約 138.44px)
    const FRAME_HEIGHT = SPRITE_HEIGHT;              // 單一幀高度 (198px)

    // 角色屬性變數
    let characterX = 100;     // 角色的 X 軸座標位置
    let characterY = 0;       // 角色的 Y 軸座標位置
    let moveSpeed = 3;        // 角色的移動速度 (像素/幀)
    let facingDirection = 1;  // 角色的朝向 (1: 向右, -1: 向左)
    let currentFrame = 0;     // 目前播放的精靈幀數索引 (0 到 8)
    let frameSpeed = 0.2;     // 動態畫面的更新速度

    // 動態生成 1246x198 的向量 Data URL 精靈圖 (確保即使沒有外部圖檔也能完美繪製)
    function createBuiltinSpriteDataUrl() {
      let svgFrames = '';
      const fw = 138.44;
      for (let i = 0; i < 9; i++) {
        let xOffset = i * fw;
        let legSwing = Math.sin(i * (Math.PI / 4.5)) * 25;
        let armSwing = Math.cos(i * (Math.PI / 4.5)) * 20;
        
        svgFrames += `
          <g transform="translate(${xOffset + 69.22}, 99)">
            <!-- 影子 -->
            <ellipse cx="0" cy="80" rx="35" ry="10" fill="#00000022"/>
            <!-- 後腿 -->
            <line x1="0" y1="20" x2="${-legSwing}" y2="70" stroke="#1d3557" stroke-width="12" stroke-linecap="round"/>
            <!-- 前腿 -->
            <line x1="0" y1="20" x2="${legSwing}" y2="70" stroke="#457b9d" stroke-width="12" stroke-linecap="round"/>
            <!-- 身體 -->
            <rect x="-25" y="-45" width="50" height="70" rx="15" fill="#e63946"/>
            <!-- 後手臂 -->
            <line x1="0" y1="-20" x2="${armSwing}" y2="15" stroke="#1d3557" stroke-width="10" stroke-linecap="round"/>
            <!-- 前手臂 -->
            <line x1="0" y1="-20" x2="${-armSwing}" y2="15" stroke="#f1faee" stroke-width="10" stroke-linecap="round"/>
            <!-- 頭部 -->
            <circle cx="0" cy="-60" r="25" fill="#f1faee" stroke="#1d3557" stroke-width="3"/>
            <!-- 眼睛 -->
            <circle cx="10" cy="-63" r="5" fill="#1d3557"/>
            <circle cx="12" cy="-65" r="2" fill="#ffffff"/>
          </g>`;
      }
      
      let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="1246" height="198" viewBox="0 0 1246 198">${svgFrames}</svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    }

    // p5.js 預載函數：預先載入預設向量精靈圖，保證一定能正常呈現
    function preload() {
      // 使用內建生成的 1246x198 向量圖檔，確保完全無視跨網域與檔案讀取限制
      spriteImage = loadImage(createBuiltinSpriteDataUrl(), () => {
        isImageLoaded = true;
      });
    }

    // p5.js 初始化函數：設定畫布與檔案上傳監聽
    function setup() {
      // 產生全螢幕畫布
      createCanvas(windowWidth, windowHeight);
      
      // 設定背景色彩為 f0ebd8
      background('#f0ebd8');
      
      // 將角色的初始 Y 軸位置設為畫布垂直中央
      characterY = height / 2;
      
      // 設定圖形與繪製錨點為中心 (0,0 位於圖像中心點)
      imageMode(CENTER);
      rectMode(CENTER);
      textAlign(CENTER, CENTER);

      // 綁定檔案上傳監聽：讓使用者可直接從電腦選擇 1/walk/waik.png 圖檔
      let fileInput = document.getElementById('file-input');
      fileInput.addEventListener('change', handleFileSelect);
    }

    // 處理使用者從電腦選取的精靈圖片檔案
    function handleFileSelect(e) {
      let file = e.target.files[0];
      if (file) {
        let reader = new FileReader();
        reader.onload = function(event) {
          // 讀取完成後建立 p5 圖像
          loadImage(event.target.result, (img) => {
            spriteImage = img;
            isImageLoaded = true;
            console.log("成功將精靈圖切換為您選取的檔案！");
          });
        };
        reader.readAsDataURL(file);
      }
    }

    // p5.js 主重複繪製函數：每秒約執行 60 次以渲染動畫
    function draw() {
      // 重新繪製全螢幕背景色 #f0ebd8，覆蓋前一幀圖像
      background('#f0ebd8');

      // 更新角色的位移、方向與精靈幀數
      updateCharacter();

      // 繪製角色精靈動畫
      drawCharacter();

      // 顯示操作提示文字資訊
      drawInstructions();
    }

    // 更新角色邏輯 (包含方向控制、邊界重設與動畫幀計算)
    function updateCharacter() {
      // 檢測鍵盤輸入：當使用者按下鍵盤左方向鍵 (LEFT_ARROW) 時轉向並向左移動
      if (keyIsDown(LEFT_ARROW)) {
        facingDirection = -1; // 將朝向設定為 -1 (水平反轉/向左)
      } else if (keyIsDown(RIGHT_ARROW)) {
        facingDirection = 1;  // 當按下右方向鍵時，朝向設定為 1 (正常方向/向右)
      }

      // 根據目前的朝向與速度更新角色的 X 軸座標 (往右或往左移動)
      characterX += moveSpeed * facingDirection;

      // 畫面邊界檢測：當角色超出螢幕右邊緣時，自動從左邊重新出現
      if (characterX > width + FRAME_WIDTH / 2) {
        characterX = -FRAME_WIDTH / 2;
      } 
      // 當角色超出螢幕左邊緣時，自動從右邊重新出現
      else if (characterX < -FRAME_WIDTH / 2) {
        characterX = width + FRAME_WIDTH / 2;
      }

      // 循環計算動畫幀數，使 9 張圖片精靈連續循環顯示 (0 到 8 索引)
      currentFrame = (currentFrame + frameSpeed) % TOTAL_FRAMES;
    }

    // 繪製角色精靈與轉向處理
    function drawCharacter() {
      // 若精靈圖尚未準備完成則暫不繪製
      if (!isImageLoaded || !spriteImage) return;

      // 計算目前播放幀在 1246x198 精靈圖中的橫向切片起始像素 (X 座標)
      let frameIndex = floor(currentFrame);            // 取得整數幀索引 (0 ~ 8)
      let sourceX = frameIndex * FRAME_WIDTH;          // 計算裁切的 X 起始位置

      // 保存目前的變換矩陣狀態
      push();

      // 將座標系原點平移至角色的當前位置 (characterX, characterY)
      translate(characterX, characterY);

      // 依據 facingDirection 進行水平鏡射轉向 (1 為原始向右，-1 為水平翻轉向左)
      scale(facingDirection, 1);

      // 繪製切片精靈圖片幀
      // 參數說明: image(圖片, 繪製X, 繪製Y, 顯示寬, 顯示高, 裁切X, 裁切Y, 裁切寬, 裁切高)
      image(
        spriteImage,
        0, 0,
        FRAME_WIDTH, FRAME_HEIGHT,
        sourceX, 0,
        FRAME_WIDTH, FRAME_HEIGHT
      );

      // 恢復先前保存的變換矩陣狀態
      pop();
    }

    // 繪製畫面頂部的互動說明
    function drawInstructions() {
      push();
      fill('#1d3557');
      noStroke();
      textSize(18);
      textStyle(BOLD);
      text("鍵盤控制：按住【左方向鍵 ←】轉向往左移動，按住【右方向鍵 →】往右移動", width / 2, 40);
      pop();
    }

    // 當瀏覽器視窗大小改變時，自動調整畫布為全螢幕
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      characterY = height / 2; // 自動調整角色垂直居中
    }
  </script>
</body>
</html>