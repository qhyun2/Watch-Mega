import React from "react";
import { useRouter } from "next/router";

import { Box, Typography } from "@material-ui/core";
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
  callback: any
): JSX.Element[] {
  if (children.size != 0) {
    return Array.from(children).map((props) => {
      return (
        <Item
          callback={callback}
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

function Item(props): JSX.Element {
  const classes = useTreeItemStyles();
  const Icon = ICONLOOKUP[props.type];
  const router = useRouter();

  return (
    <TreeItem
      nodeId={props.parent + "/" + props.name}
      label={
        <div
          className={classes.labelRoot}
          onClick={() => {
            if (props.type === "folder") {
              props.callback(props.parent + "/" + props.name);
            } else if (props.type === "media") {
              axios.post("/api/media/select", { src: "file:" + props.parent.substr(1) + "/" + props.name }).then(() => {
                router.push("/");
              });
            }
          }}>
          <Icon color="primary" className={classes.labelIcon} />
          <Typography color="textPrimary">{props.name}</Typography>
        </div>
      }
      classes={{
        content: classes.content,
        group: classes.group,
      }}>
      {renderChildren(props.name, props.type, props.children, props.parent, props.callback)}
    </TreeItem>
  );
}

interface File {
  size: number;
  added: number;
  type: "folder" | "media" | "other";
  loaded?: boolean;
  children: Map<string, File>;
}

interface State {
  files: Map<string, File>;
}

export default class Browse extends React.Component<unknown, State> {
  constructor(props) {
    super(props);
    this.state = { files: new Map<string, File>() };
  }

  async componentDidMount(): Promise<void> {
    await this.loadFiles("/");
    this.forceUpdate();
  }

  async loadFiles(path: string): Promise<void> {
    return axios("/api/media/info" + path).then((response) => {
      this.setState((state) => {
        let root = state.files;
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

        this.forceUpdate();
      });
    });
  }

  render(): JSX.Element {
    return (
      <div>
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
              {Array.from(this.state.files).map((props) => {
                return (
                  <Item
                    callback={(path) => this.loadFiles(path)}
                    key={props[0]}
                    parent=""
                    name={props[0]}
                    {...props[1]}></Item>
                );
              })}
            </TreeView>
          </Box>
        </Box>
      </div>
    );
  }
}
