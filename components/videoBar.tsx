import React, { useState, useEffect } from "react";

import axios from "axios";
import { stringify } from "qs";

import { Box, Container, Paper, Typography, useTheme } from "@material-ui/core";

const VideoBar: React.FC<{ name: string }> = (props) => {
  const [videoName, setVideoName] = useState("");
  const theme = useTheme();

  useEffect(() => {
    if (!props.name) return;

    const url = props.name.split(":");
    if (url[0] === "file") {
      setVideoName(url[1].split("/").pop() ?? "Loading...");
    } else {
      axios.get("/api/media/youtube/?" + stringify({ id: url[1] })).then((res) => setVideoName(res.data));
    }
  }, [props.name]);
  return (
    <Box pt={3}>
      <Container maxWidth="lg">
        <Paper
          style={{
            width: "100%",
            height: "100%",
            background: theme.palette.primary.main,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
          <Box mx={3} my={1}>
            <Typography variant="h6" align="center" noWrap>
              {videoName ? videoName : "Loading..."}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default VideoBar;
