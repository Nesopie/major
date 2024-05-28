import React, { useRef, useState } from "react";
import axios from "axios";
import "./index.css";
import ReactPainter from "react-painter";
import Slider from "@mui/material/Slider";
import { TextField } from "@mui/material";
import { Unstable_NumberInput } from "@mui/base";

var Buffer = require("buffer/").Buffer;

function App() {
  const [postivePrompt, setPositivePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 });
  const [finalImage, setFinalImage] = useState<string>("");
  const [seed, setSeed] = useState(1);
  const [forceReRenderKey, setForceReRenderKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const aspectRatio = imageDimensions.width / imageDimensions.height;

  const backendUrl = window.location.href;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!prompt || !image) {
      return;
    }

    const formData = new FormData();
    formData.append("prompt", postivePrompt);
    formData.append("image", image);
    formData.append("seed", seed.toString());
    formData.append("negative_prompt", negativePrompt);
    if (maskBlob) formData.append("mask", maskBlob);
    try {
      const response = await axios.post(
        maskBlob ? `${backendUrl}generate-with-mask` : `${backendUrl}generate`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          responseType: "arraybuffer",
        }
      );
      let base64ImageString = Buffer.from(response.data, "binary").toString(
        "base64"
      );

      setFinalImage(base64ImageString);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const img = document.createElement("img");

      img.onload = function () {
        setImageDimensions({
          width: img.width,
          height: img.height,
        });
      };

      const reader = new FileReader();
      reader.onloadend = function (ended) {
        img.src = ended.target!.result!.toString();
      };
      reader.readAsDataURL(event.target.files[0]);
      setImage(event.target.files[0]);
    }
  };

  return (
    <div className="w-full text-5xl bg-hero-bg from-ternary to-primary min-h-screen">
      <h1 className="text-center mx-auto text-primary">
        Generating image variations from text
      </h1>
      <form className="w-full gap-8 p-10">
        <div className="flex gap-4 justify-between">
          <div className="flex-grow-[6] flex flex-col gap-2 text-base text-start rounded-xl">
            <textarea
              className="min-h-20 p-3 text-white focus:outline-none rounded-lg border-[1px] focus:border-2  border-pink bg-dark-grey"
              value={postivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
            />
            <textarea
              className="min-h-20 p-3 text-white focus:outline-none rounded-lg border-[1px] focus:border-2 border-pink bg-dark-grey"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>
          <div className="flex-grow-[1] flex justify-center items-start">
            <button
              className="bg-gradient-to-tr from-ternary to-pink rounded-lg px-2 py-4 w-full hover:-translate-x-2 hover:-translate-y-2 transition-all hover:shadow-[7px_7px_0_1px] hover:shadow-primary"
              onClick={handleClick}
            >
              Generate
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-2 items-end text-white" ref={ref}>
        {image ? (
          <div
            className="flex justify-center items-center"
            key={forceReRenderKey}
          >
            <ReactPainter
              width={0.5 * ref.current!.offsetWidth}
              height={(0.5 * ref.current!.offsetWidth) / aspectRatio}
              image={image!}
              initialColor="white"
              onSave={(blob) => setMaskBlob(blob)}
              render={({ triggerSave, canvas, setLineWidth }) => {
                return (
                  <div className="w-full h-full flex flex-col gap-8">
                    <div className="text-lg font-medium flex gap-8 self-center">
                      <button
                        className="bg-secondary p-4 rounded-lg text-ternary font-bold"
                        onClick={triggerSave}
                      >
                        Save Mask
                      </button>
                      <button
                        className="bg-secondary p-4 rounded-lg text-ternary font-bold"
                        onClick={() => setForceReRenderKey((k) => k + 1)}
                      >
                        Reset Mask
                      </button>
                      <Slider
                        defaultValue={30}
                        valueLabelDisplay="auto"
                        shiftStep={30}
                        step={10}
                        min={10}
                        max={110}
                        onChangeCommitted={(_, b) =>
                          setLineWidth(b instanceof Array ? b[0] : b)
                        }
                      />
                      <div>
                        <label
                          className="text-base text-center hover:cursor-pointer rounded-lg text-ternary"
                          htmlFor="seed"
                        >
                          Seed
                        </label>
                        <input
                          id="seed"
                          type="number"
                          value={seed}
                          className="w-20 p-2 rounded-lg border-[1px] border-none bg-secondary text-ternary outline-none"
                          onChange={(e) => setSeed(+e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="h-full flex justify-center">{canvas}</div>
                  </div>
                );
              }}
            />
          </div>
        ) : (
          <div className="p-10 h-[30rem] flex justify-center items-center">
            <label
              className="text-base w-full text-center leading-[30rem] hover:cursor-pointer border-[1px] border-black rounded-lg"
              htmlFor="file-upload"
            >
              Upload a file
            </label>
            <input
              className="hidden"
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              //set the text color of mui compopnent to white
              style={{ color: "white" }}
            />
          </div>
        )}
        {finalImage && (
          <div className="flex flex-col">
            <h1 className="text-center w-full">Rendered Image</h1>
            <img
              src={`data:image/png;base64,${finalImage}`}
              alt="Generated image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
