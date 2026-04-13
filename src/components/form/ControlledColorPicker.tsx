import { ColorPicker, type ColorPickerProps } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledColorPickerProps extends ColorPickerProps {
  name: string;
}

const ControlledColorPicker = ({ name, ...props }: ControlledColorPickerProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <ColorPicker {...props} {...field} format="hex" />}
    />
  );
};

export default ControlledColorPicker;
