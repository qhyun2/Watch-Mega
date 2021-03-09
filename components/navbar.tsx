import React from "react";
import { createRef } from "react";
import Col from "react-bootstrap/Col";

import style from "../styles/custom.module.css";

class UsernameInput extends React.Component<
  { socket: SocketIOClient.Socket },
  { username: string; isInputing: boolean }
> {
  input = createRef<HTMLInputElement>();

  constructor(props) {
    super(props);
    this.state = {
      username: "",
      isInputing: false,
    };
  }

  submit(name) {
    this.props.socket.emit("name", name);
    this.setState({ username: name, isInputing: false });
  }

  render() {
    return (
      <Col xs="6" lg="5" xl="4" className={style.username}>
        <button
          style={{ visibility: this.state.isInputing ? "hidden" : "visible" }}
          className={"px-4 bg-dark text-light " + style.usernameField + " " + style.usernameBtn}
          onClick={() => {
            this.setState({ isInputing: true });
            setTimeout(() => this.input.current.focus(), 100);
          }}
          disabled={this.state.isInputing}>
          <h5 className="my-0 text-truncate">
            {this.state.isInputing ? "" : this.state.username ? this.state.username : "Set username"}
          </h5>
        </button>
        <input
          className={
            "px-4 text-light " +
            style.usernameField +
            " " +
            style.usernameInput +
            " " +
            (this.state.isInputing ? style.usernameShown : "")
          }
          maxLength={30}
          disabled={!this.state.isInputing}
          ref={this.input}
          onBlur={(e) => {
            this.submit(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key == "Enter") {
              this.submit(this.input.current.value);
            }
          }}
          onChange={(e) => {
            this.setState({ username: e.target.value });
          }}
          value={this.state.isInputing ? this.state.username : ""}></input>
      </Col>
    );
  }
}

function navItem(link, text, active) {
  return (
    <li className={"nav-item" + (active ? " active" : "")}>
      <a className="nav-link text-white" href={link}>
        <h5 className={"my-0" + (active ? " text-highlight" : "")}>{text}</h5>
      </a>
    </li>
  );
}

export default function Navbar(props): JSX.Element {
  return (
    <nav className="navbar navbar-expand navbar-dark bg-c-secondary">
      <div className="navbar-brand mb-0">
        <b>
          <h3 className="my-0">Watch Mega</h3>
        </b>
      </div>
      <ul className="navbar-nav mr-auto">
        {navItem("/", "Watch", props.page == "watch")}
        {navItem("/api/media/select", "Select", props.page == "select")}
        {navItem("/torrent", "Torrent", props.page == "torrent")}
      </ul>
      {props.socket && <UsernameInput socket={props.socket}></UsernameInput>}
    </nav>
  );
}
