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
    height: 25,
    width: 25,
    backgroundColor: "#fff",
    marginTop: -7,
    marginLeft: -12,
  },
  valueLabel: {
    left: "calc(-50% + 8px)",
  },
  markLabel: {
    marginTop: 8,
  },
})(Slider);

export default ThickSlider;
