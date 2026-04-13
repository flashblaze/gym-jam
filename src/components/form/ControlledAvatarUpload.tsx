import { ActionIcon, Avatar, type AvatarProps, FileButton, Tooltip } from "@mantine/core";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import IconSolarTrash from "~icons/solar/trash-bin-2-broken";

interface ControlledAvatarUploadProps extends Omit<AvatarProps, "src"> {
  name: string;
  defaultImageUrl?: string;
}

const ControlledAvatarUpload = ({
  name,
  defaultImageUrl,
  ...props
}: ControlledAvatarUploadProps) => {
  const {
    setValue,
    formState: { errors },
  } = useFormContext();

  const [preview, setPreview] = useState<string | null>(defaultImageUrl ?? null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Set form value
    setValue(name, file, { shouldValidate: true });
  };

  const handleDelete = () => {
    setPreview(null);
    setValue(name, "", { shouldValidate: true });
  };

  return (
    <div className="relative w-fit">
      <Tooltip label="Click to upload image">
        <FileButton onChange={handleFileSelect} accept="image/png,image/jpeg,image/jpg">
          {(fileButtonProps) => (
            <Avatar {...fileButtonProps} src={preview} className="cursor-pointer" {...props} />
          )}
        </FileButton>
      </Tooltip>
      {preview && (
        <ActionIcon className="absolute top-0 -right-8" onClick={handleDelete} variant="default">
          <IconSolarTrash className="text-red-500 dark:text-red-400" />
        </ActionIcon>
      )}
      {errors?.[name] && (
        <span className="mt-1 text-red-500 text-sm">{errors[name]?.message as string}</span>
      )}
    </div>
  );
};

export default ControlledAvatarUpload;
