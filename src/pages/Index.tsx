import Manual from "./Manual";
import { useROS2 } from "@/hooks/useROS2";

const Index = ({ isConnected }: { isConnected: boolean }) => {
  return <Manual isConnected={isConnected} />;
};

export default Index;
