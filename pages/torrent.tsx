import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "bootstrap/dist/css/bootstrap.css";

import Head from "next/head";
import Navbar from "../components/navbar";

import axios from "axios";

interface state {
  progress: { name: string; value: number }[];
}

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

export default class Torrent extends React.Component<unknown, state> {
  interval: NodeJS.Timeout;

  constructor(props) {
    super(props);

    this.state = { progress: [] };
  }

  componentDidMount(): void {
    this.getData();
    this.interval = setInterval(() => this.getData(), 1000);
  }

  componentWillUnmount(): void {
    clearInterval(this.interval);
  }

  getData(): void {
    axios
      .request({ url: "/api/torrent/status" })
      .then((res) => {
        this.setState({ progress: res.data });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  deleteTorrent(magnet: string): void {
    axios.request({ url: "/api/torrent/stop", method: "POST", data: { magnet } }).catch((e) => {
      console.log(e);
    });
  }

  render(): JSX.Element {
    return (
      <div className="bg">
        <Head>
          <title>Watch Mega</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header>
          <Navbar page="torrent"></Navbar>
        </header>
        <Container>
          <Row>
            <Col xs="4" className="m-auto py-4 justify-content-center">
              <form action="/api/torrent/start" method="post" className="form-inline d-flex flex-nowrap">
                <input className="form-control" type="text" name="magnet" placeholder="magnet:?xt=urn:btih:"></input>
                <button className="btn bg-c-secondary ml-4 text-white" type="submit">
                  {" "}
                  Download
                </button>
              </form>
            </Col>
          </Row>
          <Row>
            <Col xs="10" className="m-auto">
              <table className="table table-dark table-striped" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ width: "55%" }}>
                      <h3 className="my-0">Torrents</h3>
                    </th>
                    <th style={{ width: "35%" }}></th>
                    <th style={{ width: "10%" }}></th>
                  </tr>
                </thead>
                <tbody>{this.state.progress.map((r) => this.renderRow(r))}</tbody>
              </table>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  renderRow(row) {
    const progressText = Math.ceil(row.value * 100) + "%";
    return (
      <tr key={row.id}>
        <td className="align-middle text-truncate my-0">{row.name}</td>
        <td className="align-middle">
          <div className="progress align-self-center" style={{ height: "20px" }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-c-secondary"
              role="progressbar"
              style={{ width: progressText }}>
              {progressText}
            </div>
          </div>
        </td>
        <td>
          <button className="btn btn-sm btn-outline-danger m-1 x" onClick={() => this.deleteTorrent(row.id)}>
            X
          </button>
        </td>
      </tr>
    );
  }
}
