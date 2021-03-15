import React from "react";
import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography, List, ListItem } from "@material-ui/core";
import style from "../styles/custom.module.css";

class UsernameInput extends React.Component<
  { socket: SocketIOClient.Socket },
  { username: string; isInputing: boolean }
> {
  input = React.createRef<HTMLInputElement>();

  constructor(props) {
    super(props);
    this.state = { username: "", isInputing: false };
  }

  submit(name) {
    this.props.socket.emit("name", name);
    this.setState({ username: name, isInputing: false });
  }

  render() {
    return (
      <div className={style.username}>
        <button
          style={{ background: "#32383e", visibility: this.state.isInputing ? "hidden" : "visible" }}
          className={style.usernameField + " " + style.usernameBtn}
          onClick={() => {
            this.setState({ isInputing: true });
            setTimeout(() => this.input.current.focus(), 100);
          }}
          disabled={this.state.isInputing}>
          <Typography variant="h5" color="textPrimary" noWrap>
            {this.state.isInputing ? "" : this.state.username ? this.state.username : "Set username"}
          </Typography>
        </button>
        <input
          className={
            style.usernameField + " " + style.usernameInput + " " + (this.state.isInputing ? style.usernameShown : "")
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
          value={this.state.isInputing ? this.state.username : ""}
          style={{ color: "#FFFFFF", paddingLeft: "20px" }}></input>
      </div>
    );
  }
}

const NAVITEMS = [
  { title: "Watch", path: "/" },
  { title: "Select", path: "/select" },
  { title: "Browse", path: "/browse" },
  { title: "Torrent", path: "/torrent" },
];

export default function Navbar(props: { page: string; socket?: SocketIOClient.Socket }): JSX.Element {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box pr={2}>
          <Typography variant="h4" style={{ fontWeight: "bold" }}>
            Watch Mega
          </Typography>
        </Box>
        <List component="nav" style={{ display: "flex" }} disablePadding>
          {NAVITEMS.map(({ title, path }) => (
            <ListItem key={title} disableGutters>
              <Link href={path}>
                <Button>
                  <Typography variant="h6" color={title === props.page ? "textSecondary" : "textPrimary"}>
                    {title}
                  </Typography>
                </Button>
              </Link>
            </ListItem>
          ))}
        </List>
        <Box width="40%" ml="auto">
          {props.socket && <UsernameInput socket={props.socket}></UsernameInput>}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
