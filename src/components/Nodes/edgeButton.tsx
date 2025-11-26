import { EdgeProps, useReactFlow } from "@xyflow/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ButtonEdge } from "../otherUi/button-edge";

const ButtonEdgeDelete = memo((props: EdgeProps) => {
  const { setEdges } = useReactFlow();
  
    const onEdgeDelete = (evt: React.MouseEvent) => {
      evt.stopPropagation();
      
      // Delete the edge
      setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
    };

  
  return (
    <ButtonEdge {...props}>
      <Button onClick={onEdgeDelete} size="sm" variant="ghost" >
        <Trash2 size={11} />
      </Button>
    </ButtonEdge>
  );
});

ButtonEdgeDelete.displayName = 'ButtonEdgeDelete';

export default ButtonEdgeDelete;