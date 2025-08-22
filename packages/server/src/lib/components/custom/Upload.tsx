import { useEffect, useState } from "react";
import Crop from "./Crop";
import { Image } from "./Image";

interface IProps {
  setImage: (file: File) => void;
}

export default function (props: IProps) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempFile, setTempFile] = useState<File | null>(null);

  useEffect(() => {
    file && props.setImage(file);
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setTempFile(selectedFile);
      setShowCropDialog(true);
    }
  };

  const handleCrop = (croppedFile: File) => {
    setFile(croppedFile);
    setPreview(URL.createObjectURL(croppedFile));
    setShowCropDialog(false);
    setTempFile(null);
  };

  return (
    <div className="rounded-xl bg-card w-full">
      <input
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="fileInput"
        accept="image/*"
      />
      <div className="relative mt-2">
        {preview && (
          <Image
            src={preview}
            alt="Preview"
            className="rounded-sm my-4 mx-auto w-1/2 aspect-square object-contain"
          />
        )}
      </div>
      <label
        htmlFor="fileInput"
        className="block text-center py-4 border border-dashed border-primary rounded-lg cursor-pointer hover:bg-background text-foreground/60 text-xs"
      >
        {file && <p>Click to change</p>}
        {file ? file.name : "Choose an image"}
      </label>
      {tempFile && (
        <Crop
          isOpen={showCropDialog}
          onClose={() => {
            setShowCropDialog(false);
            setTempFile(null);
          }}
          image={tempFile}
          onCrop={handleCrop}
          allowedAspectRatios={['square']}
          initialAspectRatio="square"
        />
      )}
    </div>
  );
}
