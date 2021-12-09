import React from "react";

import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";

const PlayingPopup: React.FC<{ open: boolean; cb: () => void }> = (props) => {
  return (
    <Dialog open={props.open}>
      <DialogContent>
        <Box pb={2} px={2} display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h4">Welcome to WatchMega</Typography>
          <Box p={2}>
            <Typography variant="subtitle1" align="center">
              Autoplay was blocked
            </Typography>
          </Box>
          <Button variant="contained" color="primary" onClick={() => props.cb()}>
            Play video
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PlayingPopup;
