from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import base64
import io
import uuid 
import tempfile
import os

app = Flask(__name__)

dic = {0: 'Cerscospora', 1: 'Healthy', 2: 'Rust'}

model = load_model('static/assets/models/CNN-Leaf Exception-97.22.h5')

def predict_label(img_path):
    i = image.load_img(img_path, target_size=(220, 220))
    i = image.img_to_array(i) / 255.0
    i = i.reshape(1, 220, 220, 3)

    p = model.predict(i)

    
    predicted_class = np.argmax(p, axis=-1)
    
    highest_probability = max(p[0]) * 100
    
    probabilities = (p[0] * 100).tolist()

    print(probabilities)
    
    other_probabilities = {}
    for index, prob in enumerate(probabilities):
        if index != predicted_class[0]:
            other_probabilities[dic[index]] = prob  
    return {
        'label': dic[predicted_class[0]],
        'highest_probability': highest_probability,
        'other_probabilities': other_probabilities
    }



@app.route("/", methods=['GET'])
def main():
    return render_template("index.html")

@app.route("/cerscospora", methods=['GET'])
def cerscospora():
    return render_template("cerscospora.html")

@app.route("/rust", methods=['GET'])
def rust():
    return render_template("rust.html")

@app.route("/healthy", methods=['GET'])
def healthy():
    return render_template("healthy.html")

@app.route("/classification", methods=['GET', 'POST'])
def classification():
    
    temp_dir = "static/assets/temp/"

    try:
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        
        # Setelah menghapus gambar, tampilkan halaman classification.html
        return render_template("classification.html")

    except Exception as e:
        # Tangani kesalahan jika terjadi
        return f'Terjadi kesalahan: {str(e)}'

@app.route("/handing", methods=['GET'])
def handing():
    clasify = request.args.get('clasify')
    data = []

    if clasify == "Rust":
        data.extend([
            {"text": "Periksa tanaman secara rutin ", "image": "static/assets/images//handling/ru1.jpg"},
            {"text": "Pemangkasan pada penyakit yang terinfeksi penyakit rust untuk mengurangi penyebaran penyakit tersebut", "image": "static/assets/images//handling/ru2.jpg"},
            {"text": "Pengunaan fungsida, penggunaan fungsida ini dapat di gunakan untuk mengendalikan pertumbuhan jamur penyebab penyakit rust", "image": "static/assets/images//handling/ru3.jpg"},
            {"text": "Mengatur kelembaban, Upaya agar kelembababan udara di sekitar tanaman kopi tidak terlalu tinggi karena kelembababn yang tinggi mendukung pertumbuhan jamur", "image": "static/assets/images//handling/ru4.jpg"},
        ])
    elif clasify == "Cerscospora":
        data.extend([
            {"text": "Petani dapat mengendalikan penyakit ini menggunakan teknik sanitasi dengan menggunting daun yang sakit kemudian dibakar atau dibenamkan ke dalam tanah.", "image": "static/assets/images//handling/ce1.jpg"},
            {"text": "Mengurangi kelembapan tanah dengan cara mengurangi penyiraman.", "image": "static/assets/images//handling/ce2.jpg"},
            {"text": "Menjarangkan tanaman naungan sehingga sinar matahari dapat langsung masuk.", "image": "static/assets/images//handling/ce3.jpg"},
            {"text": "Melakukan pemupukan berimbang, dan menggunakan fungisida yang tepat.", "image": "static/assets/images//handling/ce4.jpg"},
        ])


    response = {
        "class": clasify,
        "data": data
    }

    return jsonify(response)

@app.route("/submit", methods=['POST'])  
def get_output():
    if request.method == 'POST':
        base64data = request.form['image']
        img_data = base64.b64decode(base64data)

        img_filename = str(uuid.uuid4()) + ".jpg"
        img_path = "static/assets/temp/" + img_filename

        with open(img_path, "wb") as f:
            f.write(img_data)

        result = predict_label(img_path)

        return jsonify(
            label=result['label'],
            highest_probability=result['highest_probability'],
            other_probabilities=result['other_probabilities'],
            img_path=img_path
        )



@app.route("/delete_image", methods=['POST'])
def delete_image():
    temp_dir = "static/assets/temp/"

    try:
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

        return jsonify(success=True, message='Semua gambar berhasil dihapus.')

    except Exception as e:
        return jsonify(success=False, message=f'Terjadi kesalahan: {str(e)}')


if __name__ == '__main__':
    app.run(debug=True)







