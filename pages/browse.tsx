import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Box, Typography, Menu, MenuItem } from "@material-ui/core";
import { TreeItem, TreeView } from "@material-ui/lab";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";

import Navbar from "../components/navbar";
import axios from "axios";

import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import FolderIcon from "@material-ui/icons/Folder";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import MovieIcon from "@material-ui/icons/Movie";
import DescriptionIcon from "@material-ui/icons/Description";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

const useTreeItemStyles = makeStyles((theme: Theme) =>
  createStyles({
    content: {
      borderTopRightRadius: theme.spacing(2),
      borderBottomRightRadius: theme.spacing(2),
      paddingRight: theme.spacing(1),
      fontWeight: theme.typography.fontWeightMedium,
    },
    group: {
      marginLeft: 0,
      "& $content": {
        paddingLeft: theme.spacing(2),
      },
    },
    labelRoot: {
      display: "flex",
      alignItems: "center",
      padding: theme.spacing(0.5, 0),
    },
    labelIcon: {
      marginRight: theme.spacing(1),
    },
  })
);

const ICONLOOKUP = {
  folder: FolderIcon,
  media: MovieIcon,
  other: DescriptionIcon,
};

function renderChildren(
  name: string,
  type: string,
  children: Map<string, File>,
  parent: string,
  callback: any,
  contextCallback: any
): JSX.Element[] {
  if (children.size != 0) {
    return Array.from(children).map((props) => {
      return (
        <Item
          callback={callback}
          contextCallback={contextCallback}
          key={parent + "/" + name + "/" + props[0]}
          name={props[0]}
          parent={parent + "/" + name}
          {...props[1]}></Item>
      );
    });
  } else if (type == "folder") {
    return [<TreeItem key={name} nodeId={name + "child"}></TreeItem>];
  } else {
    return null;
  }
}

const Item: React.FC = (props: any) => {
  const classes = useTreeItemStyles();
  const Icon = ICONLOOKUP[props.type];
  const router = useRouter();

  return (
    <TreeItem
      nodeId={props.parent + "/" + props.name}
      onClick={() => {
        if (props.type === "folder") {
          props.callback(props.parent + "/" + props.name);
        } else if (props.type === "media") {
          axios.post("/api/media/select", { src: "file:" + props.parent.substr(1) + "/" + props.name }).then(() => {
            router.push("/");
          });
        }
      }}
      label={
        <div
          className={classes.labelRoot}
          onContextMenu={(e) => {
            props.contextCallback(props.parent + "/" + props.name, e.clientX, e.clientY);
            e.preventDefault();
          }}>
          <Icon color="primary" className={classes.labelIcon} />
          <Typography color="textPrimary">{props.name}</Typography>
        </div>
      }
      classes={{
        content: classes.content,
        group: classes.group,
      }}>
      {renderChildren(props.name, props.type, props.children, props.parent, props.callback, props.contextCallback)}
    </TreeItem>
  );
};

interface File {
  size: number;
  added: number;
  type: "folder" | "media" | "other";
  loaded?: boolean;
  children: Map<string, File>;
}

const Browse: React.FC = () => {
  const [files, setFiles] = useState<Map<string, File>>(new Map<string, File>());
  const [menuTarget, setMenuTarget] = useState<string>(null);
  const [menuMouseX, setMenuMouseX] = useState<number>(0);
  const [menuMouseY, setMenuMouseY] = useState<number>(0);
  useEffect(() => {
    console.log("using effect");
    loadFiles("/");
  }, []);

  async function loadFiles(path: string): Promise<void> {
    console.log("loading:" + path);
    return axios("/api/media/info" + path).then((response) => {
      setFiles((prev) => {
        const ans = new Map(prev);
        let root = ans;

        for (const folder of path.split("/")) {
          if (!folder) continue;
          root = root.get(folder).children;
        }

        response.data.files.map((file) => {
          root.set(file.name, {
            size: file.size,
            added: file.added,
            type: file.type,
            children: new Map<string, File>(),
          });
        });

        return ans;
      });
    });
  }

  function handleClose(): void {
    setMenuTarget(null);
  }

  return (
    <React.Fragment>
      <header>
        <Navbar page="Browse" />
      </header>
      <Box display="flex">
        <Box margin="auto" paddingTop={8}>
          <TreeView
            defaultCollapseIcon={
              <ArrowForwardIosIcon
                style={{
                  transform: "rotate(90deg)",
                }}
              />
            }
            defaultExpandIcon={<ArrowForwardIosIcon />}
            defaultEndIcon={
              <div
                style={{
                  width: 24,
                }}
              />
            }>
            {files &&
              Array.from(files).map((props) => {
                return (
                  <Item
                    callback={(path) => loadFiles(path)}
                    contextCallback={(v, x, y) => {
                      setMenuTarget(v);
                      setMenuMouseX(x);
                      setMenuMouseY(y);
                    }}
                    key={props[0]}
                    parent=""
                    name={props[0]}
                    {...props[1]}></Item>
                );
              })}
          </TreeView>
        </Box>
      </Box>
      <Menu
        keepMounted
        open={menuTarget !== null}
        onClose={() => handleClose()}
        anchorReference="anchorPosition"
        anchorPosition={menuMouseY !== null && menuMouseX !== null ? { top: menuMouseY, left: menuMouseX } : undefined}>
        <MenuItem onClick={() => handleClose()}>Select</MenuItem>
        <MenuItem onClick={() => handleClose()}>Delete</MenuItem>
        <MenuItem onClick={() => handleClose()}>Rename</MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default Browse;
