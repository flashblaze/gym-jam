import { Checkbox, type CheckboxProps } from "@mantine/core";
import { get, useFormContext } from "react-hook-form";

interface ControlledCheckboxProps extends CheckboxProps {
  name: string;
}

const ControlledCheckbox = ({ name, ...props }: ControlledCheckboxProps) => {
  const {
    register,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Checkbox
      {...props}
      {...register(name)}
      error={get(errors, name)?.message as string}
      aria-invalid={!!get(errors, name)}
      readOnly={props.readOnly || isLoading || isSubmitting}
    />
  );
};

export default ControlledCheckbox;
