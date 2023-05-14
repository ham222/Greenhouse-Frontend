import React from "react";
import { useState, useEffect } from "react";

interface ThresholdBoxProps {
  title: String;
  updateValue: (state: any) => void;
}

let ThresholdBox = ({ title, updateValue }: ThresholdBoxProps): JSX.Element => {
  const [state, setState] = React.useState({
    min: 0,
    max: 0,
  });

  const handleChange = (evt: any) => {
    // console.log(state.min);
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value,
    });
    updateValue(state);
  };

  return (
    <>
      <div className="flex flex-col my-5">
        <h2 className="text-center font-semibold mt-4 mb-4 text-lg ">
          {title}
        </h2>
        <div className="flex mr-[2rem] ml-[calc(2rem+8vw)]">
          <div className="flex w-1/2">
            <p className="text-lg mr-2">Min</p>
            <input
              type="number"
              name="min"
              id=""
              className="w-3/5 py-1 bg-[#EFEFEF] rounded-lg"
              onChange={handleChange}
            />
          </div>
          <div className="flex w-1/2">
            <p className="text-lg mr-2">Max</p>
            <input
              type="number"
              name="max"
              id=""
              className="w-3/5 py-1 bg-[#EFEFEF]  rounded-lg "
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ThresholdBox;
