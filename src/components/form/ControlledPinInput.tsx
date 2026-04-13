import { PinInput, type PinInputProps } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledPinInputProps extends PinInputProps {
  name: string;
}

const ControlledPinInput = ({ name, ...props }: ControlledPinInputProps) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <>
          <PinInput
            {...field}
            {...props}
            error={Boolean(errors?.[name]?.message as string)}
            aria-invalid={!!errors?.[name]?.message}
            readOnly={props.readOnly || isLoading || isSubmitting}
          />
          {errors?.[name]?.message && (
            <p className="mt-1 text-[#e7000b] text-xs">{errors?.[name]?.message as string}</p>
          )}
        </>
      )}
    />
  );
};

export default ControlledPinInput;
