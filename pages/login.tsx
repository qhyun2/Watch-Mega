import React, { useState } from "react";
import { useRouter } from "next/router";
import { TextField, Typography, Button, Grid, Container, CircularProgress } from "@material-ui/core";

import axios from "axios";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  function submitPassword(e): void {
    e.preventDefault();
    setIsLoading(true);
    axios
      .post("/api/auth/login", { password: password })
      .then((res) => {
        if (res.data.status == "rejected") {
          setIsInvalid(true);
          setIsLoading(false);
        } else if (res.data.status == "accepted") {
          router.push("/");
        }
      })
      .catch(() => {
        setIsInvalid(true);
        setIsLoading(false);
      });
  }

  return (
    <Container maxWidth="md" style={{ height: "100vh" }}>
      <form>
        <Grid
          container
          spacing={4}
          direction="column"
          alignContent="center"
          justify="center"
          style={{ height: "100vh" }}>
          <Grid item>
            <Typography variant="h5" align="center">
              Enter Access Code
            </Typography>
          </Grid>
          <Grid item>
            <TextField
              type="password"
              error={isInvalid}
              helperText={isInvalid ? "Acess code incorrect" : ""}
              value={password}
              onBlur={() => setIsInvalid(false)}
              onChange={(e) => setPassword(e.target.value)}
              inputProps={{ style: { textAlign: "center" } }}
            />
          </Grid>
          <Grid item style={{ display: "flex", justifyContent: "center" }}>
            <Button variant="contained" color="primary" disabled={isLoading} onClick={submitPassword} type="submit">
              {isLoading && <CircularProgress size="1rem" color="secondary" style={{ marginRight: "10px" }} />}
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default Login;
