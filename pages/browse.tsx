import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Box, Typography, Menu, MenuItem, SvgIconTypeMap, Container } from "@material-ui/core";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { TreeItem, TreeView } from "@material-ui/lab";
import { useTheme } from "@material-ui/core/styles";

import Navbar from "../components/navbar";
import axios from "axios";
import { stringify } from "qs";

import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import FolderIcon from "@material-ui/icons/Folder";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import MovieIcon from "@material-ui/icons/Movie";
import DescriptionIcon from "@material-ui/icons/Description";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

interface TreeNodeProps {
  node: FileTree;
  expanded: string[];
  loadCallback: (node: FileTree) => void;
  contextCallback: (target: string, e: MouseEvent) => void;
}

const TreeNode: React.FC<TreeNodeProps> = (props) => {
  const theme = useTheme();

  let children: JSX.Element;
  if (props.node.children.size !== 0) {
    children = (
      <React.Fragment>
        {Array.from(props.node.children).map(([name, file]) => {
          return (
            <TreeNode
              key={name}
              node={file}
              expanded={props.expanded}
              loadCallback={props.loadCallback}
              contextCallback={props.contextCallback}
            />
          );
        })}
      </React.Fragment>
    );
  } else if (props.node.type == "folder") {
    children = <TreeItem key={props.node.name} nodeId={props.node.name + "child"}></TreeItem>;
  } else {
    children = null;
  }

  const type = props.node.type;
  let Icon: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
  if (type === "media") {
    Icon = MovieIcon;
  } else if (type === "other") {
    Icon = DescriptionIcon;
  } else if (props.expanded.indexOf(props.node.path) != -1) {
    Icon = FolderOpenIcon;
  } else {
    Icon = FolderIcon;
  }

  return (
    <TreeItem
      nodeId={props.node.path}
      key={props.node.path}
      onClick={() => props.loadCallback(props.node)}
      label={
        <div style={{ display: "flex", alignItems: "center", padding: theme.spacing(0.5, 0) }}>
          <Icon color="primary" style={{ marginRight: theme.spacing(1) }} />
          <Typography color="textPrimary">{props.node.name}</Typography>
        </div>
      }
      style={{
        borderTopRightRadius: theme.spacing(2),
        borderBottomRightRadius: theme.spacing(2),
        paddingRight: theme.spacing(1),
      }}>
      {children}
    </TreeItem>
  );
};

interface FileTree {
  name: string;
  path: string;
  size: number;
  added: number;
  type: "folder" | "media" | "other";
  loaded?: boolean;
  children: Map<string, FileTree>;
}

const Browse: React.FC = () => {
  const [files, setFiles] = useState<FileTree>({
    name: "root",
    path: "",
    size: 0,
    added: 0,
    type: "folder",
    children: new Map<string, FileTree>(),
  });
  const [menuTarget, setMenuTarget] = useState<string>(null);
  const [menuMouseX, setMenuMouseX] = useState<number>(0);
  const [menuMouseY, setMenuMouseY] = useState<number>(0);
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const router = useRouter();
  useEffect(() => {
    loadFiles("/");
  }, []);

  function handleToggle(event: React.ChangeEvent<unknown>, nodeIds: string[]): void {
    setExpanded(nodeIds);
  }

  async function loadFiles(path: string): Promise<void> {
    console.log("loading:" + "/api/media/info?" + stringify({ src: "file:" + path }));
    return axios("/api/media/info?" + stringify({ src: "file:" + path }))
      .then((response) => {
        if (response.status != 200) return;
        setFiles((prev) => {
          const ans = { ...prev };
          let root = ans;

          for (const folder of path.split("/")) {
            if (!folder) continue;
            root = root.children.get(folder);
          }

          response.data.files.map((file) => {
            root.children.set(file.name, {
              name: file.name,
              path: root.path + "/" + file.name,
              size: file.size,
              added: file.added,
              type: file.type,
              children: new Map<string, FileTree>(),
            });
          });
          return ans;
        });
      })
      .catch(Function.prototype()); // noop
  }

  function loadCallback(node: FileTree): void {
    if (node.type === "folder") {
      loadFiles(node.path);
    } else if (node.type === "media") {
      axios.post("/api/media/select", { src: "file:" + node.path }).then(() => {
        router.push("/");
      });
    }
  }

  function contextCallback(target: string, e: MouseEvent): void {
    e.preventDefault();
    setMenuTarget(target);
    setMenuMouseX(e.clientX);
    setMenuMouseY(e.clientY);
  }

  function handleClose(): void {
    setMenuTarget(null);
  }

  console.clear();

  return (
    <React.Fragment>
      <header>
        <Navbar page="Browse" />
      </header>
      <Box pt={4}>
        <Container maxWidth="md">
          <TreeView
            defaultCollapseIcon={<ArrowForwardIosIcon style={{ transform: "rotate(90deg)" }} />}
            defaultExpandIcon={<ArrowForwardIosIcon />}
            defaultEndIcon={<div style={{ width: 24 }} />}
            onNodeToggle={handleToggle}
            expanded={expanded}>
            {Array.from(files.children).map(([name, node]) => {
              return (
                <TreeNode
                  key={name}
                  node={node}
                  expanded={expanded}
                  loadCallback={loadCallback}
                  contextCallback={contextCallback}
                />
              );
            })}
          </TreeView>
        </Container>
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
