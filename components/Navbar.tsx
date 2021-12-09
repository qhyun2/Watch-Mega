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
import makeStyles from "@mui/styles/makeStyles";
import MenuIcon from "@mui/icons-material/Menu";

const useStyles = makeStyles((theme) => ({
  burger: {
    display: "none",
    [theme.breakpoints.down("md")]: {
      display: "block",
    },
  },
  navbar: {
    display: "flex",
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  toolbar: {
    minHeight: 64,
    [theme.breakpoints.down("md")]: {
      justifyContent: "space-between",
    },
  },
  title: {
    fontWeight: "bold",
    padding: 16,
  },
}));

const NAVITEMS = [
  { title: "Watch", path: "/" },
  { title: "Browse", path: "/browse" },
  { title: "History", path: "/history" },
  { title: "Youtube", path: "/youtube" },
  { title: "Torrent", path: "/torrent" },
];

const NavDrawer: React.FC<{ page: string; open: boolean; setOpen: (state: boolean) => void }> = (props) => {
  const classes = useStyles();
  return (
    <SwipeableDrawer
      anchor={"left"}
      open={props.open}
      onClose={() => props.setOpen(false)}
      onOpen={() => props.setOpen(true)}>
      <List style={{ minWidth: 180 }}>
        <Typography variant="h5" className={classes.title} noWrap>
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
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  return (
    <AppBar position="static" enableColorOnDark>
      <Toolbar className={classes.toolbar}>
        <IconButton edge="end" className={classes.burger} onClick={() => setOpen(true)} size="large">
          <MenuIcon fontSize="large" />
        </IconButton>
        <Box px={2}>
          <Typography className={classes.title} variant="h4" noWrap>
            Watch Mega
          </Typography>
        </Box>
        <List component="nav" disablePadding className={classes.navbar}>
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
