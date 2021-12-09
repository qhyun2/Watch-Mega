import React, { useState } from "react";

import { Box, Hidden, AppBar, IconButton, Typography, Grid, Paper } from "@mui/material";
import { Minimize } from "@mui/icons-material";

// interface ChatContentProps {}

const ChatContentBox: React.FC<{}> = (props) => {
  return (
    <Box height="70vh" p={15}>
      Chat and usernames coming soon!
    </Box>
  );
};

interface UserList {
  count: number;
  usernames: string[];
}

interface ChatBoxProps {
  userlist: UserList;
}

const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [shown, setShown] = useState(false);

  const userString = `${props.userlist.count} user${props.userlist.count == 1 ? "" : "s"} currently watching`;

  return (
    <Hidden lgDown>
      <Box position="fixed" bottom={0} right={0} width={380}>
        <Paper square>
          <AppBar position="static" onClick={() => setShown(!shown)}>
            <Box p={1} pl={2}>
              <Grid container wrap="nowrap" justifyContent="space-between">
                <Grid item container justifyContent="center" direction="column">
                  <Typography variant="h6">{userString}</Typography>
                </Grid>
                <Grid item>
                  <IconButton style={{ borderRadius: 0 }} size="large">
                    <Minimize fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </AppBar>
          {shown && <ChatContentBox />}
        </Paper>
      </Box>
    </Hidden>
  );
};

export default ChatBox;
