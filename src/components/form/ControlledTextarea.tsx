import { Textarea, type TextareaProps } from "@mantine/core";
import { get, useFormContext } from "react-hook-form";

interface ControlledTextareaProps extends TextareaProps {
  name: string;
}

const ControlledTextarea = ({ name, ...props }: ControlledTextareaProps) => {
  const {
    register,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Textarea
      {...props}
      {...register(name)}
      error={get(errors, name)?.message as string}
      aria-invalid={!!get(errors, name)}
      readOnly={props.readOnly || isLoading || isSubmitting}
    />
  );
};

export default ControlledTextarea;
