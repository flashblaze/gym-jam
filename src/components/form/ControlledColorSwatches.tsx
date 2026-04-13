import { ColorSwatch, type ColorSwatchProps } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";
import IconTablerCheck from "~icons/tabler/check";

interface ControlledColorSwatchesProps extends Omit<ColorSwatchProps, "onChange" | "color"> {
  name: string;
  swatches: string[];
}

const ControlledColorSwatches = ({ name, swatches }: ControlledColorSwatchesProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="grid grid-cols-3 xs:grid-cols-6 gap-2">
          {swatches.map((color) => (
            <ColorSwatch
              key={color}
              component="button"
              type="button"
              color={color}
              onClick={() => field.onChange(color)}
              className="flex h-12 w-12 cursor-pointer items-center justify-center text-white"
            >
              {field.value === color && <IconTablerCheck className="text-2xl" />}
            </ColorSwatch>
          ))}
        </div>
      )}
    />
  );
};

export default ControlledColorSwatches;
