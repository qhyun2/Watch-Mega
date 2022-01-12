import React, { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  List,
  ListItem,
  SwipeableDrawer,
  ListItemText,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useIsMobile } from "../lib/hooks";

const NAVITEMS = [
  { title: "Watch", path: "/" },
  { title: "History", path: "/history" },
  { title: "Browse", path: "/browse" },
  { title: "Torrent", path: "/torrent" },
  { title: "Youtube", path: "/youtube" },
  { title: "Upload", path: "/upload" },
];

const NavDrawer: React.FC<{ page: string; open: boolean; setOpen: (state: boolean) => void }> = (props) => {
  return (
    <SwipeableDrawer
      anchor={"left"}
      open={props.open}
      onClose={() => props.setOpen(false)}
      onOpen={() => props.setOpen(true)}>
      <List style={{ minWidth: 180 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", padding: 2 }} noWrap>
          Watch Mega
        </Typography>
        {NAVITEMS.map(({ title, path }) => (
          <Link href={path} key={title} passHref>
            <ListItem button>
              <Typography variant="h5" color={title === props.page ? "secondary" : "textPrimary"}>
                <a href={path} style={{ color: "inherit", textDecoration: "none" }}>
                  <ListItemText primary={title} />
                </a>
              </Typography>
            </ListItem>
          </Link>
        ))}
      </List>
    </SwipeableDrawer>
  );
};

const Navbar: React.FC<{ page: string }> = (props) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <AppBar position="static" enableColorOnDark>
      <Toolbar variant={isMobile ? "dense" : undefined}>
        <IconButton
          edge="start"
          sx={{ display: { xs: "flex", md: "none" }, padding: "1px" }}
          onClick={() => setOpen(true)}
          size="small">
          <MenuIcon fontSize="large" />
        </IconButton>
        <Box px={2} sx={{ display: { xs: "none", md: "block" } }}>
          <Typography sx={{ fontWeight: "bold" }} variant="h4" noWrap>
            Watch Mega
          </Typography>
        </Box>
        <List component="nav" disablePadding sx={{ display: { xs: "none", md: "flex" } }}>
          {NAVITEMS.map(({ title, path }) => (
            <ListItem key={title} disableGutters>
              <Link href={path} passHref>
                <Button>
                  <Typography variant="h6" color={title === props.page ? "secondary" : "textPrimary"}>
                    <a href={path} style={{ color: "inherit", textDecoration: "none" }}>
                      {title}
                    </a>
                  </Typography>
                </Button>
              </Link>
            </ListItem>
          ))}
        </List>
      </Toolbar>
      <NavDrawer {...props} open={open} setOpen={setOpen} />
    </AppBar>
  );
};

export default Navbar;
