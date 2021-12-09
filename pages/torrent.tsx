import React, { useState, useEffect } from "react";

import {
  Box,
  Button,
  Container,
  Grid,
  LinearProgress,
  LinearProgressProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import Navbar from "../components/Navbar";

import axios from "axios";

import { defaultAuth } from "../lib/Auth";
export { defaultAuth as getServerSideProps };

const LinearProgressWithLabel: React.FC<LinearProgressProps & { value: number }> = (props) => {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
};

interface TorrentProgress {
  name: string;
  value: number;
  id: string;
}

interface TableRowProps {
  torrent: TorrentProgress;
  deleteCallback: (id: string) => void;
}

const ProgressRow: React.FC<TableRowProps> = (props) => {
  return (
    <TableRow key={props.torrent.id}>
      <TableCell>
        <Typography variant="subtitle1">{props.torrent.name}</Typography>
      </TableCell>
      <TableCell align="center">
        <LinearProgressWithLabel value={props.torrent.value * 100} />
      </TableCell>
      <TableCell>
        <Button variant="outlined" onClick={() => props.deleteCallback(props.torrent.id)}>
          X
        </Button>
      </TableCell>
    </TableRow>
  );
};

const Torrent: React.FC = () => {
  const [progress, setProgress] = useState<TorrentProgress[]>([]);
  useEffect(() => {
    getData();
    const interval = setInterval(() => getData(), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  function getData() {
    axios
      .request({
        url: "/api/torrent/status",
      })
      .then((res) => {
        setProgress(res.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function deleteTorrent(magnet: string) {
    axios
      .request({
        url: "/api/torrent/stop",
        method: "POST",
        data: {
          magnet,
        },
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <React.Fragment>
      <header>
        <Navbar page="Torrent" />
      </header>
      <Box pt={4}>
        <Container maxWidth="lg">
          <Grid container justifyContent="center">
            <Grid item xs={4}>
              <form
                action="/api/torrent/start"
                method="post"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}>
                <Grid item container spacing={1}>
                  <Grid item xs={9}>
                    <TextField
                      variant="standard"
                      type="text"
                      name="magnet"
                      placeholder="magnet:?xt=urn:btih:"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      style={{
                        height: "100%",
                      }}>
                      DOWNLOAD
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
          <Grid container justifyContent="center">
            <Grid item xs={10}>
              <Table style={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: "50%" }}>
                      <Typography variant="h4">Torrents</Typography>
                    </TableCell>
                    <TableCell style={{ width: "40%" }}></TableCell>
                    <TableCell style={{ width: "10%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progress.map((r) => (
                    <ProgressRow key={r.name} deleteCallback={deleteTorrent} torrent={r}></ProgressRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </React.Fragment>
  );
};

export default Torrent;
