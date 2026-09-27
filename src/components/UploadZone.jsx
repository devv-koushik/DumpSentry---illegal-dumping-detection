import { useRef, useState } from "react";
import { UploadCloud, ImageIcon } from "lucide-react";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("Please upload a JPG, JPEG, PNG or WEBP image.");
      return;
    }
    setError("");
    onFileSelected(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload drone image"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed p-14 text-center transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-ink/15 bg-white hover:border-ink/30"
        }`}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink">
          <UploadCloud size={24} />
        </div>
        <div>
          <p className="font-medium text-ink">Drop drone image here</p>
          <p className="mt-1 text-sm text-muted">
            or <span className="font-medium text-accent-deep">browse files</span>
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ImageIcon size={13} /> JPG · JPEG · PNG · WEBP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
