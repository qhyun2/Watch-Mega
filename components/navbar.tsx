import React from "react";
import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography, List, ListItem } from "@material-ui/core";

const NAVITEMS = [
  { title: "Watch", path: "/" },
  { title: "Select", path: "/select" },
  { title: "Browse", path: "/browse" },
  { title: "Torrent", path: "/torrent" },
];

const Navbar: React.FC<{ page: string; socket?: SocketIOClient.Socket }> = (props) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box pr={2}>
          <Typography variant="h4" style={{ fontWeight: "bold" }} noWrap>
            Watch Mega
          </Typography>
        </Box>
        <List component="nav" style={{ display: "flex" }} disablePadding>
          {NAVITEMS.map(({ title, path }) => (
            <ListItem key={title} disableGutters>
              <Link href={path}>
                <Button>
                  <Typography variant="h6" color={title === props.page ? "secondary" : "textPrimary"}>
                    <a href={path}>{title}</a>
                  </Typography>
                </Button>
              </Link>
            </ListItem>
          ))}
        </List>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
