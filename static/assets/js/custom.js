let labels = [];
let dataValues = [];

function clearImage() {
    document.getElementById("upload_image").value = "";
    $("#result").empty();
    $("#penjelasan").hide();
    $("#penjelasan").empty();
    $("#hasilDeteksi").hide();
    $("#pie").hide();
    // clearChartData();
    

  

  // Tambahkan pemanggilan AJAX untuk menghapus gambar
  $.ajax({
    url: "/delete_image",
    type: "POST",
    success: function (response) {
      console.log(response);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function getLink(prediction) {
  if (prediction === "Healthy") {
    return "/healthy";
  } else if (prediction === "Cerscospora") {
    return "/cerscospora";
  } else if (prediction === "Rust") {
    return "/rust";
  }
}


//Cropping 
$(document).ready(function () {
  var $modal = $("#modal");
  var image = document.getElementById("sample_image");
  var cropper;

  $("#upload_image").change(function (event) {
    var files = event.target.files;

    var done = function (url) {
      image.src = url;
      $modal.modal("show");
    };

    if (files && files.length > 0) {
      reader = new FileReader();
      reader.onload = function (event) {
        done(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
  });

  $modal
    .on("shown.bs.modal", function () {
      cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 3,
        preview: ".preview",
      });
    })
    .on("hidden.bs.modal", function () {
      cropper.destroy();
      cropper = null;
    });

  $("#crop").click(function () {
    canvas = cropper.getCroppedCanvas({
      width: 220,
      height: 220,
    });

    canvas.toBlob(function (blob) {
      var reader = new FileReader();
      reader.onloadend = function () {
        var base64data = reader.result.split(",")[1];

        while (base64data.length % 4 !== 0) {
          base64data += "=";
        }

        $.ajax({
          url: "/submit",
          method: "POST",
          data: { image: base64data },
          success: function (data) {
            $modal.modal("hide");
            $("#uploaded_image").attr("src", data.img_path);

            var label = data.label;
            var highest_probability = data.highest_probability;

            $("#hasilDeteksi").show();
            $("#result").empty();

            var buttonClass =
              label === "Healthy" ? "btn-success" : "btn-warning";

            var penangananButtonLabel =
              label === "Healthy"
                ? "Tidak ada penanganan"
                : "Penanganan penyakit " + label;

                $("#result").append(`
                <div style="display: grid; grid-template-columns: 50% auto; align-items: center;">
                    <img id="image" height="70%" width="70%" src="${data.img_path}">
                    <div>
                        <h4>Hasil: <button class="btn ${buttonClass}" '">${label}</button></h4>
                        <p>Probabilitas Terbesar: ${highest_probability.toFixed(2)}%</p>
                        ${
                            label === "Healthy"
                                ? `<button class="btn ${buttonClass}">${penangananButtonLabel}</button>`
                                : `<button class="btn btn-info" onclick="showPenjelasan('${label}')">${penangananButtonLabel}</button>`
                        }
                        <br>
                        <br>
                        <button class="btn btn-info" onclick="location.href='${getLink(label)}'">Baca Selengkapnya</button>
                    </div>
                </div>
            `);
            
            
        
                       

        // Ambil data untuk pie chart dari respons JSON
        const labels = [data.label];
        
        const dataValues = [data.highest_probability];
        

        for (const label in data.other_probabilities) {
            labels.push(label);
            dataValues.push(data.other_probabilities[label]);
        }

        console.log('Labels:', labels);
        console.log('Data Values:', dataValues);

          // Menentukan warna berdasarkan label
          const backgroundColors = labels.map(label => {
            switch (label) {
                case 'Healthy':
                    return 'rgba(0, 100, 0, 0.7)'; // Hijau
                case 'Rust':
                    return 'rgba(255, 206, 86, 0.7)'; // Kuning
                case 'Cerscospora':
                    return 'rgba(102, 51, 0, 0.7)'; // Ungu
                // Tambahkan warna untuk label lain jika diperlukan
                default:
                    return 'rgba(255, 99, 132, 0.7)'; // Warna default
            }
          });

          // Buat konfigurasi untuk pie chart dengan warna yang sudah ditentukan
          const config = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                }]
            },
            options: {
                responsive: true,
                aspectRatio: 1,
                maintainAspectRatio: false,
                width: 100,
                height: 100
            }
          };

        
          // Dapatkan elemen canvas untuk pie chart
          const ctx = document.getElementById('pieChart').getContext('2d');

          // Buat pie chart menggunakan Chart.js
          if (window.pieChart && window.pieChart.destroy) {
            window.pieChart.destroy();
        }
        
          window.pieChart = new Chart(ctx, config);

          // Menampilkan elemen card setelah chart dibuat
          $("#pie").show();
                
        // Menampilkan kembali elemen card setelah chart dibuat
        const pieCard = document.getElementById('pie');
        pieCard.style.display = 'block';
        
        

          },
          error: function (error) {
            console.log(error);
          },
        });
      };
      reader.readAsDataURL(blob);
    });
  });
});

function showPenjelasan(penyakit) {
  var penjelasanContainer = document.getElementById("penjelasanContainer");

  $.ajax({
    url: `/handing?clasify=${penyakit}`,
    type: "GET",
    success: function (response) {
      let clasify = response.class;
      let guides = response.data;

      console.log(penyakit)
      var cardBody = penjelasanContainer.querySelector(".card-body");

      let penjelasan =
        `<div style='max-height: 300px; overflow: auto;'><p>${clasify} terdeteksi. Berikut adalah langkah-langkah penanganan yang dapat Anda lakukan:</p>`;

      guides.map((data, i) => {
        penjelasan += "<li>" + data.text;

        if (data.image != null) {
          penjelasan +=
            "<img src='" +
            data.image +
            "' style='width: 100px; height: 100px; object-fit: cover; display: block; margin: 0 auto' />";
        }
        penjelasan += "</li>";
      });

      penjelasan += "</div>";
      cardBody.innerHTML = penjelasan;
      penjelasanContainer.style.display = "block";
    },
    error: function (error) {
      console.error(error);
    },
  });
}



function closePenjelasan() {
  var penjelasanContainer = document.getElementById("penjelasanContainer");
  penjelasanContainer.style.display = "none";
}

function clearChartData() {
  labels.length = 0;
  dataValues.length = 0;
}


function showTutorial() {
  $('#tutorialModal').modal('show'); // Tampilkan modal
}


window.onload = function() {
  showTutorial(); 
};