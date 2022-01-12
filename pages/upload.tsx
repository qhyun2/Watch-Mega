import React, { useState } from "react";
import { Button, Grid, LinearProgress, Typography } from "@mui/material";
import axios from "axios";
import Navbar from "../components/Navbar";

const Upload: React.FC = () => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const formData = new FormData();
    Array.from(event.target.files).forEach((file) => {
      formData.append(event.target.name, file);
    });

    axios
      .post("/api/media/upload", formData, {
        headers: { "content-type": "multipart/form-data" },
        onUploadProgress: (event) => setUploadProgress(event.loaded / event.total),
      })
      .then(() => {
        setSuccess(true);
        setUploadProgress(0);
      })
      .catch(() => {
        setError(true);
      });
    formRef.current?.reset();
  };

  return (
    <React.Fragment>
      <header>
        <Navbar page="Watch" />
      </header>
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        spacing={4}
        style={{ minHeight: "60vh" }}>
        <Grid item xs={3}>
          <form ref={formRef}>
            <Button onClick={() => fileInputRef.current?.click()} variant="contained">
              Upload Files
            </Button>
            <input
              type="file"
              multiple={true}
              name={"main"}
              onChange={uploadFiles}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
          </form>
        </Grid>
        {uploadProgress != 0 && (
          <Grid item container alignItems={"center"} justifyContent={"center"} spacing={1} xs={6}>
            <Grid item>
              <LinearProgress value={uploadProgress * 100} variant="determinate" sx={{ minWidth: "30vw" }} />
            </Grid>
            <Grid item>
              <Typography>{`${Math.round(uploadProgress * 100)}%`}</Typography>
            </Grid>
          </Grid>
        )}
        <Grid item>{error && <Typography color="red">Upload error!</Typography>}</Grid>
        <Grid item>{success && <Typography color="lightgreen">Upload Success!</Typography>}</Grid>
      </Grid>
    </React.Fragment>
  );
};

export default Upload;
