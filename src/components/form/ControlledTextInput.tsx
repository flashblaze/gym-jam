import { TextInput, type TextInputProps } from "@mantine/core";
import { get, useFormContext } from "react-hook-form";

interface ControlledTextInputProps extends TextInputProps {
  name: string;
}

const ControlledTextInput = ({ name, ...props }: ControlledTextInputProps) => {
  const {
    register,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <TextInput
      {...props}
      {...register(name)}
      error={get(errors, name)?.message as string}
      aria-invalid={!!get(errors, name)}
      readOnly={props.readOnly || isLoading || isSubmitting}
    />
  );
};

export default ControlledTextInput;
