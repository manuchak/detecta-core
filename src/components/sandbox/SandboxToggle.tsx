import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSandbox } from "@/contexts/SandboxContext";
import { TestTube2 } from "lucide-react";

export const SandboxToggle = () => {
  const { isSandboxMode, toggleSandboxMode } = useSandbox();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-l border-border/40">
      <TestTube2 className={`h-4 w-4 ${isSandboxMode ? 'text-warning' : 'text-muted-foreground'}`} />
      <Label htmlFor="sandbox-mode" className="text-sm cursor-pointer">
        Sandbox
      </Label>
      <Switch
        id="sandbox-mode"
        checked={isSandboxMode}
        onCheckedChange={toggleSandboxMode}
        className="data-[state=checked]:bg-warning"
      />
    </div>
  );
};
