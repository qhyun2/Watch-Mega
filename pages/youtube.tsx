import React, { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Box, Button, Container, Grid, TextField, Typography } from "@mui/material";

// authentication
import { defaultServerSidePropsAuth } from "../lib/withSession";
export { defaultServerSidePropsAuth as getServerSideProps };

const YoutubeSelector: React.FC = () => {
  const [youtubeLink, setYoutubeLink] = useState("");
  const router = useRouter();

  return (
    <Grid item container spacing={1} wrap="nowrap" alignItems="center">
      <Grid item style={{ flexGrow: 1 }}>
        <TextField
          variant="standard"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          fullWidth
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (!youtubeLink) return;
            const regex = youtubeLink.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            const id = regex ? regex.pop() : null;
            if (id) {
              axios.post("/api/media/select", { src: "youtube:" + id }).then(() => {
                router.push("/");
              });
            }
          }}>
          SELECT
        </Button>
      </Grid>
    </Grid>
  );
};

const Youtube: React.FC = () => {
  return (
    <React.Fragment>
      <header>
        <Navbar page="Youtube" />
      </header>
      <Box pt={4}>
        <Container maxWidth="sm">
          <Box pb={2}>
            <Typography variant="h5" color="textPrimary">
              Select youtube link
            </Typography>
          </Box>
          <Grid container spacing={8}>
            <YoutubeSelector />
          </Grid>
        </Container>
      </Box>
    </React.Fragment>
  );
};

export default Youtube;
