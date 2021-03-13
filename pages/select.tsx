import React from "react";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

import Head from "next/head";
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
import { makeStyles } from "@material-ui/core/styles";

interface state {
  historyLoading: boolean;
  history: { name: string; timestamp: number }[];
  page: number;
}

export default class Select extends React.Component<unknown, state> {
  constructor(props) {
    super(props);

    this.state = {
      historyLoading: true,
      history: [],
      page: 0,
    };
  }

  loadHistory(): void {
    axios
      .get("/api/media/history", { params: { start: this.state.page * 5, end: (this.state.page + 1) * 5 - 1 } })
      .then((response) => {
        this.setState({ historyLoading: false, history: response.data.history });
      });
  }

  componentDidMount(): void {
    this.loadHistory();
  }

  renderHistoryItems(): JSX.Element[] {
    if (this.state.historyLoading) {
      return Array(5).fill(
        <GridListTile>
          <Skeleton variant="rect" height={108} animation="wave" />
        </GridListTile>
      );
    } else {
      return this.state.history.map((data) => {
        return (
          <GridListTile key={data.name}>
            <HistoryItem {...data}></HistoryItem>
          </GridListTile>
        );
      });
    }
  }

  render(): JSX.Element {
    return (
      <div>
        <Head>
          <title>Watch Mega | Select</title>
        </Head>
        <header>
          <Navbar page="select"></Navbar>
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
                <GridList cellHeight={120} cols={1}>
                  {this.renderHistoryItems()}
                </GridList>
                <Box display="flex" justifyContent="center">
                  <Pagination count={3} color="primary" disabled />
                </Box>
              </Grid>
              <Grid item container xs={4} spacing={2} direction="column">
                <Grid item>
                  <Box>
                    <a href="/api/media/select">
                      <Button variant="contained" color="primary" size="large" fullWidth>
                        Open file bowser
                      </Button>
                    </a>
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
      </div>
    );
  }
}

function selectHistory(name: string): void {
  axios.get("/api/media/select/" + name).then(() => {
    window.location.assign("/");
  });
}

const HistoryItem = (props: { name: string; timestamp: number }) => {
  const useStyles = makeStyles(() => ({
    cover: {
      width: 192,
      height: 108,
    },
    fill: {
      width: "100%",
    },
  }));
  const classes = useStyles();

  return (
    <ButtonBase className={classes.fill} onClick={() => selectHistory(props.name)}>
      <Card className={classes.fill} raised={true}>
        <Grid container wrap="nowrap">
          <CardMedia className={classes.cover} image={"/api/media/thumb/" + props.name} />
          <CardContent>
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
