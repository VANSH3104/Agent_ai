import { EdgeProps } from "@xyflow/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ButtonEdge } from "../otherUi/button-edge";

const ButtonEdgeDelete = memo((props: EdgeProps) => {
  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    window.alert('Edge has been clicked!');
  };
  
  return (
    <ButtonEdge {...props}>
      <Button onClick={onEdgeClick} size="sm" variant="ghost" >
        <Trash2 size={11} />
      </Button>
    </ButtonEdge>
  );
});

ButtonEdgeDelete.displayName = 'ButtonEdgeDelete';

export default ButtonEdgeDelete;