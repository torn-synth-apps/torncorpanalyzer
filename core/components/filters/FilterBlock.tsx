import React from "react";
import DualRangeSlider from "./DualRangeSlider";

interface FilterBlockProps {
  label: string;
  minLimit: number;
  maxLimit: number;
  currentMin: number;
  currentMax: number | null;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number | null) => void;
  step?: number;
}

const FilterBlock: React.FC<FilterBlockProps> = ({
  label,
  minLimit,
  maxLimit,
  currentMin,
  currentMax,
  onChangeMin,
  onChangeMax,
  step = 1,
}) => {
  const safeMax = currentMax === null ? maxLimit : currentMax;

  return (
    <div className="flex flex-col gap-1 p-3 bg-muted/30 border border-border">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2 items-center mb-1">
        <input
          type="number"
          className="w-full border border-border bg-background p-1 text-xs rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Min"
          min={minLimit}
          max={safeMax}
          value={currentMin}
          onChange={(e) => onChangeMin(Number(e.target.value))}
        />
        <span className="text-muted-foreground text-xs">-</span>
        <input
          type="number"
          className="w-full border border-border bg-background p-1 text-xs rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Max"
          min={currentMin}
          max={maxLimit}
          value={currentMax === null ? maxLimit : currentMax}
          onChange={(e) => onChangeMax(Number(e.target.value))}
        />
      </div>
      <DualRangeSlider
        min={minLimit}
        max={maxLimit}
        minVal={currentMin}
        maxVal={safeMax}
        step={step}
        onChangeMin={onChangeMin}
        onChangeMax={(val) => onChangeMax(val === maxLimit ? null : val)}
      />
    </div>
  );
};

export default FilterBlock;
