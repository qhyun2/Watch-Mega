import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Box, Typography, Menu, MenuItem, SvgIconTypeMap, Container, Grid } from "@material-ui/core";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { Skeleton, TreeItem, TreeView } from "@material-ui/lab";
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
import { defaultAuth } from "../lib/Auth";
export { defaultAuth as getServerSideProps };

interface TreeNodeProps {
  node: FileTree;
  expanded: string[];
  loadCallback: (node: FileTree) => void;
  contextCallback: (target: FileTree, e: MouseEvent) => void;
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
    children = <Skeleton variant="rect" height={32} style={{ margin: "4px 4px" }} />;
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
      onContextMenu={(e) => {
        props.contextCallback(props.node, (e as unknown) as MouseEvent);
        e.stopPropagation();
      }}
      label={
        <div style={{ display: "flex", alignItems: "center", padding: theme.spacing(0.5, 0) }}>
          <Icon color="primary" style={{ marginRight: theme.spacing(1) }} />
          <Typography color={props.node.name == "[empty]" ? "error" : "textPrimary"} noWrap>
            {props.node.name}
          </Typography>
        </div>
      }>
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
  isLoaded?: boolean;
  children: Map<string, FileTree>;
}

function traverseTree(path: string, root: FileTree): FileTree {
  for (const folder of path.split("/")) {
    if (!folder) continue;
    root = root.children.get(folder);
  }
  return root;
}

function climbTree(root: FileTree): string {
  return root.path.split("/").slice(0, -1).join("/");
}

const Browse: React.FC = () => {
  const [files, setFiles] = useState<FileTree>({
    name: "root",
    path: "",
    size: 0,
    added: 0,
    type: "folder",
    isLoaded: false,
    children: new Map<string, FileTree>(),
  });
  const [menuTarget, setMenuTarget] = useState<FileTree>(null);
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
    const root = traverseTree(path, files);
    if (root.isLoaded) return;
    return axios("/api/media/info?" + stringify({ src: "file:" + path }))
      .then((response) => {
        if (response.status != 200) return;
        setFiles((prev) => {
          const ans = { ...prev };
          const root = traverseTree(path, ans);
          root.children.clear();
          if (response.data.files.length === 0) {
            const empty = "[empty]";
            root.children.set(empty, {
              name: empty,
              path: root.path + "/" + empty,
              size: 0,
              added: 0,
              type: "other",
              isLoaded: false,
              children: new Map<string, FileTree>(),
            });
          } else {
            response.data.files.map((file) => {
              root.children.set(file.name, {
                name: file.name,
                path: root.path + "/" + file.name,
                size: file.size,
                added: file.added,
                type: file.type,
                isLoaded: false,
                children: new Map<string, FileTree>(),
              });
            });
          }

          root.isLoaded = true;
          return ans;
        });
      })
      .catch(Function.prototype()); // noop
  }

  function loadCallback(node: FileTree): void {
    if (node.type === "folder") {
      loadFiles(node.path);
    } else if (node.type === "media") {
      selectNode(node);
    }
  }

  function contextCallback(target: FileTree, e: MouseEvent): void {
    e.preventDefault();
    setMenuTarget(target);
    setMenuMouseX(e.clientX);
    setMenuMouseY(e.clientY);
  }

  function selectNode(node: FileTree): void {
    axios.post("/api/media/select", { src: "file:" + node.path }).then(() => {
      router.push("/");
    });
  }

  function deleteNode(node: FileTree): void {
    axios.post("/api/media/delete", { src: "file:" + node.path }).then(() => {
      const path = climbTree(node);
      const changed = traverseTree(path, files);
      changed.isLoaded = false;
      loadFiles(climbTree(node));
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
      <Box pt={4}>
        <Container maxWidth="md">
          <TreeView
            defaultCollapseIcon={<ArrowForwardIosIcon style={{ transform: "rotate(90deg)" }} />}
            defaultExpandIcon={<ArrowForwardIosIcon />}
            defaultEndIcon={<div style={{ width: 24 }} />}
            onNodeToggle={handleToggle}
            expanded={expanded}>
            {files.isLoaded ? (
              Array.from(files.children).map(([name, node]) => {
                return (
                  <TreeNode
                    key={name}
                    node={node}
                    expanded={expanded}
                    loadCallback={loadCallback}
                    contextCallback={contextCallback}
                  />
                );
              })
            ) : (
              <Skeleton variant="rect" height={420} />
            )}
          </TreeView>
        </Container>
      </Box>
      <Menu
        keepMounted
        open={menuTarget !== null}
        onClose={() => handleClose()}
        anchorReference="anchorPosition"
        anchorPosition={menuMouseY !== null && menuMouseX !== null ? { top: menuMouseY, left: menuMouseX } : undefined}>
        <MenuItem
          onClick={() => {
            selectNode(menuTarget);
            handleClose();
          }}>
          Select
        </MenuItem>
        <MenuItem
          onClick={() => {
            deleteNode(menuTarget);
            handleClose();
          }}>
          Delete
        </MenuItem>
        <MenuItem onClick={() => handleClose()}>Rename</MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default Browse;
