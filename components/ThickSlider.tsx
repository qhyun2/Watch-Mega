import { Slider } from "@mui/material";

import withStyles from "@mui/styles/withStyles";

const ThickSlider = withStyles({
  root: {
    height: 9,
  },
  rail: {
    height: 9,
    borderRadius: 3,
  },
  track: {
    height: 9,
    borderRadius: 3,
  },
  thumb: {
    height: "25px !important",
    width: "25px !important",
    backgroundColor: "#fff",
  },
  valueLabel: {
    left: "calc(-50% + 8px)",
  },
  markLabel: {
    marginTop: 8,
  },
})(Slider);

export default ThickSlider;
