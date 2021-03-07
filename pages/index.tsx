import Head from "next/head";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "bootstrap/dist/css/bootstrap.css";
import Navbar from "../components/navbar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  return (
    <div className="bg">
      <Head>
        <title>Watch Mega</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header>
        <Navbar></Navbar>
      </header>
      <Container>
        <Row className="pt-4 justify-content-center">
          <Col xs="1">
            <button className="btn bg-c-secondary text-white h-100 w-100" id="prevep">
              <FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon>
            </button>
          </Col>
          <Col xs="10" className="m-auto">
            <div className="alert alert-dark bg-c-secondary mb-0" role="alert" style={{ borderStyle: "none" }}>
              <h5 className="text-center text-highlight mb-0" id="videoname">
                YO
              </h5>
            </div>
          </Col>
          <Col xs="1">
            <button className="btn bg-c-secondary text-white h-100 w-100" id="nextep">
              <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
            </button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
