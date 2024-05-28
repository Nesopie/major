from flask import Flask, request, send_file, send_from_directory
import torch
from diffusers import AutoPipelineForImage2Image, AutoPipelineForInpainting
from diffusers.utils import make_image_grid, load_image
from PIL import Image
import numpy as np
import cv2
from werkzeug.utils import secure_filename
from pathlib import Path
from flask_cors import CORS, cross_origin
import os
from PIL import Image

app = Flask(__name__, static_folder='react_app/build')
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

#function that rounds the provided number to the nearest multiple of 8
def round_to_multiple_8(number):
    return int((number + 7) / 8) * 8

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route("/generate", methods=['POST'])
@cross_origin()
def generate():
    prompt = request.form["prompt"]
    file = request.files["image"]
    negative_prompt = request.form["negative_prompt"]
    filename = secure_filename(file.filename)
    file.save(filename)
    generator = torch.Generator("cuda").manual_seed(int(request.form["seed"]))

    image_file_path = str(Path.cwd()) + "/" + filename

    initial_image = load_image(image_file_path)
    
    pipeline = AutoPipelineForImage2Image.from_pretrained(
        "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    ).to("cuda")

    final_image = pipeline(prompt, image=initial_image, strength=0.5, generator=generator, negative_prompt=negative_prompt).images[0]
    final_image.save("final_image.png")

    # make_image_grid([initial_image, image], rows=1, cols=2)

    return send_file("final_image.png") 

@app.route("/generate-with-mask", methods=["POST"])
@cross_origin()
def generate_with_mask():
    prompt = request.form["prompt"]
    file = request.files["image"]
    negative_prompt = request.form["negative_prompt"]
    filename = secure_filename(file.filename)
    file.save(filename)
    
    maskFile = request.files["mask"]
    maskFilename = secure_filename(maskFile.filename + ".png")
    maskFile.save(maskFilename)
    generator = torch.Generator("cuda").manual_seed(int(request.form["seed"]))
    
    img = Image.open(maskFilename)
    pixels = img.load()
    
    print("height", img.size[1])
    print("width", img.size[0])
    print(pixels[0,0])

    for y in range(img.size[1]):
        for x in range(img.size[0]):
            r, g, b, _ = pixels[x, y]
    
            if not (r == 255 and g == 255 and b == 255):
                pixels[x, y] = (0, 0, 0, 255)
    
    img.save(maskFilename)
    pipeline = AutoPipelineForInpainting.from_pretrained("runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16, variant="fp16", use_safetensors=True).to("cuda")
    init_image = load_image(filename)
    mask_image = load_image(maskFilename)
    final_image = pipeline(prompt=prompt, image=init_image, mask_image=mask_image, strength=0.5, width=round_to_multiple_8(init_image.size[0]), height=round_to_multiple_8(init_image.size[1]), generator=generator).images[0]
    
    # final_image = final_image.resize(init_image.size)

    final_image.save("final_image.png")
    return send_file("final_image.png")
    

if __name__ == '__main__':
    app.run(use_reloader=True, port=5000, threaded=True)
