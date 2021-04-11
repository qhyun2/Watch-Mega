import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import Navbar from "../components/navbar";

import moment from "moment";
import axios from "axios";
import { stringify } from "qs";

import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  GridList,
  GridListTile,
  TextField,
  Typography,
} from "@material-ui/core";
import { Pagination, Skeleton } from "@material-ui/lab";

// authentication
import { defaultAuth } from "../lib/Auth";
export { defaultAuth as getServerSideProps };

const YoutubeSelector: React.FC = () => {
  const [youtubeLink, setYoutubeLink] = useState("");
  const router = useRouter();

  return (
    <Grid item container spacing={1} wrap="nowrap">
      <Grid item style={{ flexGrow: 1 }}>
        <TextField
          id="outlined-basic"
          label="Youtube Link"
          fullWidth
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          style={{ height: "100%" }}
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
          select
        </Button>
      </Grid>
    </Grid>
  );
};

interface HistoryItem {
  name: string;
  timestamp: number;
}

const HistoryItem: React.FC<HistoryItem> = (props) => {
  const [videoName, setVideoName] = useState<string>();
  const router = useRouter();
  const url = props.name.split(":");

  useEffect(() => {
    if (url[0] === "file") {
      setVideoName(url[1].split("/").pop() ?? "Loading...");
    } else {
      axios.get("/api/media/youtube/?" + stringify({ id: url[1] })).then((res) => setVideoName(res.data));
    }
  }, [props.name]);

  return (
    <ButtonBase
      onClick={() => {
        axios.post("/api/media/select", { src: props.name }).then(() => {
          router.push("/");
        });
      }}
      style={{ width: "100%" }}>
      <Card style={{ width: "100%" }} raised={true}>
        <Grid container wrap="nowrap">
          <CardMedia
            style={{ width: 192, height: 108, flexShrink: 0 }}
            image={"/api/media/thumb?" + stringify({ src: props.name })}
          />
          <CardContent style={{ minWidth: 0 }}>
            <Typography component="h6" variant="subtitle1" align="left" noWrap>
              {videoName ? videoName : "Loading..."}
            </Typography>
            <Typography variant="body1" color="textSecondary" align="left" noWrap>
              {moment(props.timestamp).fromNow()}
            </Typography>
          </CardContent>
        </Grid>
      </Card>
    </ButtonBase>
  );
};

interface HistoryItemsProps {
  isHistoryLoading: boolean;
  page: number;
  history: Map<number, HistoryItem>;
}

const HistoryItems: React.FC<HistoryItemsProps> = (props) => {
  if (props.isHistoryLoading) {
    return (
      <React.Fragment>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <GridListTile key={i} style={{ width: "100%", paddingBottom: 10 }}>
              <Skeleton variant="rect" height={108} animation="wave" />
            </GridListTile>
          ))}{" "}
      </React.Fragment>
    );
  } else {
    const index = props.page * 5;
    const data: HistoryItem[] = [];
    for (let i = index; i < index + 5; i++) {
      const item = props.history.get(i);
      if (item) data.push();
    }

    return (
      <React.Fragment>
        {data.map((item) =>
          item ? (
            <GridListTile key={item.name} style={{ width: "100%", paddingBottom: 10 }}>
              <HistoryItem {...item}></HistoryItem>
            </GridListTile>
          ) : null
        )}
      </React.Fragment>
    );
  }
};

const HistoryPanel: React.FC = () => {
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [history, setHistory] = useState(new Map<number, HistoryItem>());
  const [maxPages, setMaxPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState(new Set<number>());

  useEffect(() => {
    loadHistory(1);
  });

  function loadHistory(page: number): Promise<void> {
    if (loadedPages.has(page)) return new Promise((r) => r());
    setIsHistoryLoading(true);
    return axios
      .get("/api/media/history", { params: { start: (page - 1) * 5, end: page * 5 - 1 } })
      .then((response) => {
        setHistory((history) => {
          setIsHistoryLoading(false);
          setMaxPages(response.data.maxPages);
          Array.from<HistoryItem>(response.data.history).forEach((item, index) => history.set(page * 5 + index, item));
          setLoadedPages((old) => old.add(page));
          return history;
        });
      });
  }

  if (maxPages === 0) {
    return (
      <Typography variant="h6" color="textSecondary">
        No history yet :/
      </Typography>
    );
  }

  return (
    <React.Fragment>
      <GridList cellHeight={120} cols={1} style={{ minHeight: 640, alignContent: "flex-start" }}>
        <HistoryItems isHistoryLoading={isHistoryLoading} page={page} history={history} />
      </GridList>
      <Box display="flex" justifyContent="center">
        <Pagination
          count={maxPages}
          page={page}
          onChange={(_, page) => {
            loadHistory(page);
            setPage(page);
          }}
          color="primary"
        />
      </Box>
    </React.Fragment>
  );
};

const Select: React.FC = () => {
  return (
    <React.Fragment>
      <header>
        <Navbar page="Select" />
      </header>
      <Box pt={4}>
        <Container>
          <Box pb={2}>
            <Typography variant="h4" color="textPrimary">
              History
            </Typography>
          </Box>
          <Grid container spacing={8}>
            <Grid item xs={12} md={8}>
              <HistoryPanel />
            </Grid>
            <Grid item container xs={12} md={4} spacing={2} direction="column">
              <Grid item>
                <Box>
                  <Link href="/browse">
                    <Button variant="contained" color="primary" size="large" fullWidth>
                      Open file bowser
                    </Button>
                  </Link>
                </Box>
              </Grid>
              <Grid item>
                <Divider />
              </Grid>
              <Grid item>
                <YoutubeSelector />
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </React.Fragment>
  );
};

export default Select;
