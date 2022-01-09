import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

import Navbar from "../components/Navbar";

import axios from "axios";
import { stringify } from "qs";

import { Box, Typography, Menu, MenuItem, Skeleton, SvgIconTypeMap, Container, useTheme } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { TreeItem, TreeView } from "@mui/lab";
import { ArrowForwardIos, Folder, FolderOpen, Movie, Description } from "@mui/icons-material";

// authentication
import { defaultServerSidePropsAuth } from "../lib/withSession";
export { defaultServerSidePropsAuth as getServerSideProps };

interface TreeNodeProps {
  node: FileTree;
  expanded: string[];
  loadCallback: (node: FileTree) => void;
  contextCallback: (target: FileTree, e: MouseEvent) => void;
}

const TreeNode: React.FC<TreeNodeProps> = (props) => {
  const theme = useTheme();

  let children: JSX.Element | null;
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
    children = <Skeleton variant="rectangular" height={32} style={{ margin: "4px 4px" }} />;
  } else {
    children = null;
  }

  const type = props.node.type;
  let Icon: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
  if (type === "media") {
    Icon = Movie;
  } else if (type === "other") {
    Icon = Description;
  } else if (props.expanded.indexOf(props.node.path) != -1) {
    Icon = FolderOpen;
  } else {
    Icon = Folder;
  }

  return (
    <TreeItem
      nodeId={props.node.path}
      key={props.node.path}
      onClick={() => props.loadCallback(props.node)}
      onContextMenu={(e) => {
        props.contextCallback(props.node, e as unknown as MouseEvent);
        e.stopPropagation();
      }}
      label={
        <div style={{ display: "flex", alignItems: "center", padding: theme.spacing(0.5, 0), width: "95%" }}>
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

interface File {
  name: string;
  path: string;
  size: number;
  added: number;
  type: "folder" | "media" | "other";
}

interface FileTree extends File {
  isLoaded?: boolean;
  children: Map<string, FileTree>;
}

function traverseTree(path: string, root: FileTree): FileTree {
  for (const folder of path.split("/")) {
    if (!folder) continue;
    const next = root.children.get(folder);
    if (!next) throw new Error("Error traversing path:" + path);
    root = next;
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
  const [menuTarget, setMenuTarget] = useState<FileTree | null>(null);
  const [menuMouseX, setMenuMouseX] = useState<number>(0);
  const [menuMouseY, setMenuMouseY] = useState<number>(0);
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const router = useRouter();

  function handleToggle(event: React.ChangeEvent<unknown>, nodeIds: string[]): void {
    setExpanded(nodeIds);
  }

  const loadFiles = useCallback(
    async (path: string) => {
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
              response.data.files.map((file: File) => {
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
    },
    [files]
  );

  useEffect(() => {
    loadFiles("/");
  }, [loadFiles]);

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
    axios.post("/api/media/select", { src: { path: "file:" + node.path } }).then(() => {
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
            defaultCollapseIcon={<ArrowForwardIos style={{ transform: "rotate(90deg)" }} />}
            defaultExpandIcon={<ArrowForwardIos />}
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
              <Skeleton variant="rectangular" height={420} />
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
            if (menuTarget) selectNode(menuTarget);
            handleClose();
          }}>
          Select
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuTarget) deleteNode(menuTarget);
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
