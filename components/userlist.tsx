import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";

interface UserList {
  count: number;
  usernames: string[];
}

export default function renderWatching(props: UserList): JSX.Element {
  const count = props.count;
  const names = props.usernames;
  const anon = count - names.length;

  function renderRow(name: string): JSX.Element {
    return (
      <TableRow key={name}>
        <TableCell>
          <Typography color="textPrimary">{name}</Typography>
        </TableCell>
      </TableRow>
    );
  }

  function renderRemaining(): JSX.Element {
    if (anon && names.length > 0) {
      return (
        <TableRow>
          <TableCell>
            <Typography color="textPrimary">{`and ${anon} other user${anon === 1 ? "" : "s"}`}</Typography>
          </TableCell>
        </TableRow>
      );
    }
  }
  return (
    <Box pt={4}>
      <Container maxWidth="xs">
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>{count + ` user${count == 1 ? "" : "s"} currently watching`}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table>
              <TableBody>
                {props.usernames.map((name) => renderRow(name))}
                {renderRemaining()}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
}
