import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Head from "next/head";
import "bootstrap/dist/css/bootstrap.css";

import axios from "axios";

export default class Login extends React.Component<unknown> {
  state = { isLoading: false, isInvalid: false, password: "" };

  submitPassword(e): void {
    e.preventDefault();
    this.setState({ isLoading: true });
    axios({
      method: "post",
      url: "/api/auth/login",
      data: {
        password: this.state.password,
      },
    })
      .then((res) => {
        if (res.data.status == "rejected") {
          this.setState({ isLoading: false, isInvalid: true });
        } else if (res.data.status == "accepted") {
          window.location.assign("/");
        }
      })
      .catch((e) => {
        this.setState({ isInvalid: true });
        console.log(e);
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  render(): JSX.Element {
    return (
      <div className="bg">
        <Head>
          <title>Watch Mega | Login</title>
        </Head>
        <Container className="vh-100">
          <Row className="h-100 justify-content-center">
            <form className="my-auto d-flex flex-column align-content-center">
              <div className="form-group">
                <label className="form-label text-white" htmlFor="password">
                  <h3>Enter Access Code</h3>
                </label>
                <input
                  id="password"
                  className={
                    "form-control black-border-solid text-center " + (this.state.isInvalid ? "is-invalid" : "")
                  }
                  type="password"
                  value={this.state.password}
                  onBlur={() => this.setState({ isInvalid: false })}
                  onChange={(e) => this.setState({ password: e.target.value })}></input>
                <div className="invalid-feedback">Access code incorrect</div>
              </div>
              <div className="form-group mx-auto">
                <button
                  className="btn bg-c-secondary text-white"
                  disabled={this.state.isLoading}
                  onClick={(e) => this.submitPassword(e)}>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    style={{ display: this.state.isLoading ? "visible" : "none" }}></span>
                  Submit
                </button>
              </div>
            </form>
          </Row>
        </Container>
      </div>
    );
  }
}
