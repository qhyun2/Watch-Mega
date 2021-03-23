import React from "react";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

import Link from "next/link";
import Navbar from "../components/navbar";
import moment from "moment";
import axios from "axios";

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

interface HistoryItem {
  name: string;
  timestamp: number;
}

interface state {
  historyLoading: boolean;
  history: Map<number, HistoryItem>;
  maxPages: number;
  page: number;
}

export default class Select extends React.Component<unknown, state> {
  loadedPages: Set<number>;

  constructor(props) {
    super(props);

    this.loadedPages = new Set<number>();
    this.state = {
      historyLoading: true,
      history: new Map<number, HistoryItem>(),
      maxPages: 1,
      page: 1,
    };
  }

  loadHistory(page: number): Promise<void> {
    if (this.loadedPages.has(page)) return;
    this.setState({ historyLoading: true });
    return axios
      .get("/api/media/history", { params: { start: (page - 1) * 5, end: page * 5 - 1 } })
      .then((response) => {
        this.setState((state) => {
          const newState = { ...state, historyLoading: false, maxPages: response.data.maxPages };
          Array.from<HistoryItem>(response.data.history).forEach((item, index) =>
            newState.history.set(page * 5 + index, item)
          );
          this.loadedPages.add(page);
          return newState;
        });
      });
  }

  async componentDidMount(): Promise<void> {
    await this.loadHistory(1);
  }

  renderHistoryItems(): JSX.Element[] {
    if (this.state.historyLoading) {
      return Array(5)
        .fill(0)
        .map((_, i) => (
          <GridListTile key={i}>
            <Skeleton variant="rect" height={108} animation="wave" />
          </GridListTile>
        ));
    } else {
      const index = this.state.page * 5;
      const data: HistoryItem[] = [];
      for (let i = index; i < index + 5; i++) {
        data.push(this.state.history.get(i));
      }

      return data.map((item) =>
        item ? (
          <GridListTile key={item.name}>
            <HistoryItem {...item}></HistoryItem>
          </GridListTile>
        ) : null
      );
    }
  }

  render(): JSX.Element {
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
              <Grid item xs={8}>
                {this.state.maxPages !== 0 ? (
                  <>
                    <GridList cellHeight={120} cols={1} style={{ minHeight: 640, alignContent: "flex-start" }}>
                      {this.renderHistoryItems()}
                    </GridList>
                    <Box display="flex" justifyContent="center">
                      <Pagination
                        count={this.state.maxPages}
                        page={this.state.page}
                        onChange={(_, page) => {
                          this.loadHistory(page);
                          this.setState({ page });
                          this.forceUpdate();
                        }}
                        color="primary"
                      />
                    </Box>
                  </>
                ) : (
                  <Typography variant="h6" color="textSecondary">
                    No history yet :/
                  </Typography>
                )}
              </Grid>
              <Grid item container xs={4} spacing={2} direction="column">
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
                <Grid item container spacing={1}>
                  <Grid item xs={9}>
                    <TextField id="outlined-basic" label="Youtube Link" fullWidth disabled />
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" color="primary" style={{ height: "100%" }} disabled>
                      Select
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </React.Fragment>
    );
  }
}

function selectHistory(name: string): void {
  axios.get("/api/media/select/" + name).then(() => {
    window.location.assign("/");
  });
}

const HistoryItem = (props: { name: string; timestamp: number }) => {
  return (
    <ButtonBase onClick={() => selectHistory(props.name)} style={{ width: "100%" }}>
      <Card style={{ width: "100%" }} raised={true}>
        <Grid container wrap="nowrap">
          <CardMedia style={{ width: 192, height: 108, flexShrink: 0 }} image={"/api/media/thumb/" + props.name} />
          <CardContent style={{ minWidth: 0 }}>
            <Typography component="h6" variant="subtitle1" align="left" noWrap>
              {props.name.split("/").pop()}
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
