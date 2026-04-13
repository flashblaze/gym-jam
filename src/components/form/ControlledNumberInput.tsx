import { NumberInput, type NumberInputProps } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledNumberInputProps extends NumberInputProps {
  name: string;
}

const ControlledNumberInput = ({ name, ...props }: ControlledNumberInputProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <NumberInput {...props} {...field} />}
    />
  );
};
export default ControlledNumberInput;
