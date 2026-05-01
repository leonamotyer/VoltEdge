"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
}

export function ExcelUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith(".xlsx")) {
      setUploadState({
        status: "error",
        message: "Invalid file format. Only .xlsx files are accepted.",
      });
      return;
    }

    setUploadState({ status: "uploading", message: "Processing Excel file..." });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8001/api/upload/curtailment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const result = await response.json();

      setUploadState({
        status: "success",
        message: result.message || "File uploaded successfully",
      });
    } catch (error) {
      setUploadState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to upload file",
      });
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    if (uploadState.status !== "uploading") {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="upload-container">
      <div
        className={`upload-dropzone ${isDragging ? "dragging" : ""} ${uploadState.status}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload Excel file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileInput}
          style={{ display: "none" }}
          aria-label="Excel file input"
        />

        {uploadState.status === "idle" && !isDragging && (
          <>
            <p className="upload-text">Drop .xlsx file or click to browse</p>
            <p className="upload-hint">Sheet: "10 Min Data", Header row: 7</p>
          </>
        )}

        {uploadState.status === "idle" && isDragging && (
          <p className="upload-text">Drop file to upload</p>
        )}

        {uploadState.status === "uploading" && (
          <>
            <div className="spinner" aria-label="Processing file" />
            <p className="upload-text">{uploadState.message}</p>
          </>
        )}

        {uploadState.status === "success" && (
          <>
            <p className="upload-text success-text">✓ {uploadState.message}</p>
          </>
        )}

        {uploadState.status === "error" && (
          <>
            <p className="upload-text error-text">✗ {uploadState.message}</p>
            <p className="upload-hint">Click to try again</p>
          </>
        )}
      </div>
    </div>
  );
}
