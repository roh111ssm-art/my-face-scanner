const videoElement = document.getElementById('webcam');
const actionBtn = document.getElementById('actionBtn');
const resultsCard = document.getElementById('resultsCard');
const symmetryBar = document.getElementById('symmetryBar');
const symText = document.getElementById('symText');
const shapeResult = document.getElementById('shapeResult');
const hairResult = document.getElementById('hairResult');
let faceMeshLoaded = false;
let latestFaceLandmarks = null;

const faceMesh = new FaceMesh({
    locateFile: function(file) { return "https://jsdelivr.net" + file; }
});
faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

faceMesh.onResults(function(results) {
    if (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        latestFaceLandmarks = results.multiFaceLandmarks[0];
        if (!faceMeshLoaded) {
            actionBtn.innerText = "RUN BIOMETRIC SCAN";
            faceMeshLoaded = true;
        }
    } else { latestFaceLandmarks = null; }
});

const camera = new Camera(videoElement, {
    onFrame: async () => { await faceMesh.send({ image: videoElement }); },
    width: 640, height: 480
});
camera.start().catch(function() { actionBtn.innerText = "CAMERA ERROR"; });

actionBtn.addEventListener('click', () => {
    if (!faceMeshLoaded || !latestFaceLandmarks) { alert("Face not detected! Align your face inside the oval."); return; }
    actionBtn.innerText = "SCANNING...";
    resultsCard.classList.add('hidden');
    setTimeout(() => {
        const noseTip = latestFaceLandmarks[1];
        const leftEyeOuter = latestFaceLandmarks[33];
        const rightEyeOuter = latestFaceLandmarks[263];
        const topForehead = latestFaceLandmarks[10];
        const bottomChin = latestFaceLandmarks[152];
        const leftCheek = latestFaceLandmarks[234];
        const rightCheek = latestFaceLandmarks[454];

        const leftEyeDistance = Math.abs(leftEyeOuter.x - noseTip.x);
        const rightEyeDistance = Math.abs(rightEyeOuter.x - noseTip.x);
        const symmetryRatio = Math.min(leftEyeDistance, rightEyeDistance) / Math.max(leftEyeDistance, rightEyeDistance);
        const displaySymmetry = Math.floor(symmetryRatio * 20) + 78;

        const faceTotalHeight = Math.abs(bottomChin.y - topForehead.y);
        const faceTotalWidth = Math.abs(rightCheek.x - leftCheek.x);
        const proportionalityIndex = faceTotalHeight / faceTotalWidth;

        let detectedShape = "Balanced Oval";
        let recommendedStyle = "Modern Quiff / Low Fade";
        if (proportionalityIndex < 1.32) { detectedShape = "Strong Square Profile"; recommendedStyle = "Textured Crop or Side Part"; }
        else if (proportionalityIndex > 1.52) { detectedShape = "Elongated Diamond"; recommendedStyle = "Fringe Crop or Classic Taper"; }

        symText.innerText = displaySymmetry + "%";
        symmetryBar.style.width = displaySymmetry + "%";
        shapeResult.innerText = detectedShape;
        hairResult.innerText = recommendedStyle;
        resultsCard.classList.remove('hidden');
        actionBtn.innerText = "RE-SCAN BIOMETRICS";
    }, 2000);
});

