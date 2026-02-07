import React from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  step?: number;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  minVal,
  maxVal,
  onChangeMin,
  onChangeMax,
  step = 1,
}) => {
  const minPos = Math.min(((minVal - min) / (max - min)) * 100, 100);
  const maxPos = Math.min(((maxVal - min) / (max - min)) * 100, 100);

  return (
    <div className="relative w-full h-8 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(e) => {
          const value = Math.min(Number(e.target.value), maxVal - step);
          onChangeMin(value);
        }}
        className="absolute w-full h-full pointer-events-none appearance-none bg-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(e) => {
          const value = Math.max(Number(e.target.value), minVal + step);
          onChangeMax(value);
        }}
        className="absolute w-full h-full pointer-events-none appearance-none bg-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary"
      />
      <div className="absolute w-full h-1 bg-muted rounded z-10">
        <div
          className="absolute h-full bg-primary/40 rounded"
          style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
        />
      </div>
    </div>
  );
};

export default DualRangeSlider;
