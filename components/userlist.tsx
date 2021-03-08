import { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Collapse from "react-bootstrap/Collapse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";

import style from "../styles/custom.module.css";

interface UserList {
  count: number;
  usernames: string[];
}

export default function renderWatching(props: UserList): JSX.Element {
  const [open, setOpen] = useState(false);
  const count = props.count;
  const names = props.usernames;
  const anon = count - names.length;

  function renderRow(name: string): JSX.Element {
    return (
      <tr key={name}>
        <td>{name}</td>
      </tr>
    );
  }

  function renderRemaining(): JSX.Element {
    if (anon && names.length > 0) {
      return (
        <tr>
          <td>{`and ${anon} other user${anon === 1 ? "" : "s"}`}</td>
        </tr>
      );
    }
  }

  return (
    <Row>
      <Col xs="4" className="m-auto pt-4">
        <Card className="bg-c-secondary">
          <Card.Header className="p-0">
            <button
              className="btn bg-c-secondary w-100 h-100"
              onClick={() => {
                if (anon != count) setOpen(!open);
              }}
            >
              <FontAwesomeIcon
                icon={faAngleRight}
                rotation={open ? 90 : undefined}
                className={style.animate}
              ></FontAwesomeIcon>{" "}
              <span className="text-white">{count + ` user${count == 1 ? "" : "s"} currently watching`}</span>
            </button>
          </Card.Header>
          <Collapse in={open}>
            <div>
              <div className="card-body py-0">
                <table className="table table-dark bg-c-secondary text-dark mb-0">
                  <tbody className="text-white">
                    {props.usernames.map((name) => renderRow(name))}
                    {renderRemaining()}
                  </tbody>
                </table>
              </div>
            </div>
          </Collapse>
        </Card>
      </Col>
    </Row>
  );
}
