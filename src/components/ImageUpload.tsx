import React, { useState, useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
}

export default function ImageUpload({ onImageChange }: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onImageChange(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      {imagePreview ? (
        <Card className="relative w-full h-64 overflow-hidden">
          <Image
            src={imagePreview}
            alt="Preview"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <Card className="w-full h-64 border-2 border-dashed border-muted hover:bg-accent/50 transition-colors cursor-pointer">
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 800x400px)</p>
            </div>
          </label>
        </Card>
      )}
      <input
        type="file"
        id="image"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        ref={fileInputRef}
      />
    </div>
  );
}
