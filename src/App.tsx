import { Button, Select, TextInput } from "@mantine/core";

const App = () => {
  return (
    <div className="flex flex-col">
      <Button className="w-fit">Hello!</Button>
      <Select data={["Hello", "World"]} className="w-fit" />
      <TextInput label="Name" className="w-fit" />
    </div>
  );
};

export default App;
