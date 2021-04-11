import { Slider, withStyles } from "@material-ui/core";

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
    marginTop: "-7px !important",
    marginLeft: "-12px !important",
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
