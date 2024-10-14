import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
} from "@mui/material";

const LANES = {
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  REVIEW: "review",
  DONE: "done",
};

const initialBlocks = [
  { id: "block-1", content: "Block 1", state: LANES.TODO, history: [] },
  { id: "block-2", content: "Block 2", state: LANES.IN_PROGRESS, history: [] },
  { id: "block-3", content: "Block 3", state: LANES.DONE, history: [] },
];

const lanes = [
  { id: LANES.TODO, title: "To Do" },
  { id: LANES.IN_PROGRESS, title: "In Progress" },
  { id: LANES.REVIEW, title: "Review" },
  { id: LANES.DONE, title: "Done" },
];

const transitionRules = {
  [LANES.TODO]: [LANES.IN_PROGRESS],
  [LANES.IN_PROGRESS]: [LANES.REVIEW, LANES.DONE],
  [LANES.REVIEW]: [LANES.IN_PROGRESS, LANES.DONE],
  [LANES.DONE]: [LANES.TODO],
};

const transitionData = {
  [LANES.TODO]: {
    [LANES.IN_PROGRESS]: [
      { name: "assignee", type: "text", label: "Assignee" },
    ],
  },
  [LANES.IN_PROGRESS]: {
    [LANES.REVIEW]: [{ name: "reviewer", type: "text", label: "Reviewer" }],
    [LANES.DONE]: [
      { name: "completionDate", type: "date", label: "Completion Date" },
    ],
  },
  [LANES.REVIEW]: {
    [LANES.IN_PROGRESS]: [
      { name: "comments", type: "text", label: "Review Comments" },
    ],
    [LANES.DONE]: [
      { name: "approvalDate", type: "date", label: "Approval Date" },
    ],
  },
  [LANES.DONE]: {
    [LANES.TODO]: [
      { name: "reason", type: "text", label: "Reason for Reopening" },
    ],
  },
};

const SwimLaneApp = () => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [alert, setAlert] = useState(false);
  const [transitionFormData, setTransitionFormData] = useState({});
  const [filter, setFilter] = useState("");

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // If there's no destination, we don't need to do anything
    if (!destination) return;

    // If the source and destination are the same, we don't need to do anything
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceState = source.droppableId;
    const destinationState = destination.droppableId;

    // Check if the transition is allowed
    if (
      transitionRules[sourceState] &&
      transitionRules[sourceState].includes(destinationState)
    ) {
      const block = blocks.find((b) => b.id === draggableId);
      if (block) {
        setSelectedBlock({ ...block, newState: destinationState });
        setShowTransitionDialog(true);
        setTransitionFormData({});
        setAlert(false);
      } else {
        console.error(`Block with id ${draggableId} not found`);
      }
    } else {
      console.log("This transition is not allowed");
      setAlert(true);
    }
  };

  const handleTransition = () => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.id === selectedBlock.id) {
          const newHistory = [
            ...block.history,
            {
              from: block.state,
              to: selectedBlock.newState,
              data: transitionFormData,
              timestamp: new Date().toISOString(),
            },
          ];
          return {
            ...block,
            state: selectedBlock.newState,
            history: newHistory,
          };
        }
        return block;
      })
    );
    setShowTransitionDialog(false);
    setSelectedBlock(null);
  };

  const filteredBlocks = blocks.filter((block) =>
    block.content.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Filter blocks..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 4 }}
      />
      <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
        <Box sx={{ display: "flex", gap: 4 }}>
          {lanes.map((lane) => (
            <Paper key={lane.id} sx={{ flex: 1, p: 2, bgcolor: "grey.100" }}>
              <Typography variant="h6" gutterBottom>
                {lane.title}
              </Typography>
              <Droppable droppableId={lane.id}>
                {(provided) => (
                  <Box
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{ minHeight: 200 }}
                  >
                    {filteredBlocks
                      .filter((block) => block.state === lane.id)
                      .map((block, index) => (
                        <Draggable
                          key={block.id}
                          draggableId={block.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                p: 2,
                                mb: 2,
                                bgcolor: snapshot.isDragging
                                  ? "action.hover"
                                  : "background.paper",
                                userSelect: "none",
                                "&:hover": { bgcolor: "action.hover" },
                              }}
                              onClick={() => setSelectedBlock(block)}
                            >
                              {block.content}
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      <Dialog
        open={!!selectedBlock && !showTransitionDialog}
        onClose={() => setSelectedBlock(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedBlock?.content}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography variant="h6" gutterBottom>
              Transition History:
            </Typography>
            <List>
              {selectedBlock?.history.map((entry, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`From ${entry.from} to ${entry.to} on ${new Date(
                      entry.timestamp
                    ).toLocaleString()}`}
                    secondary={
                      <React.Fragment>
                        {Object.entries(entry.data).map(([key, value]) => (
                          <Typography
                            key={key}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {key}: {value}
                            <br />
                          </Typography>
                        ))}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContentText>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showTransitionDialog}
        onClose={() => setShowTransitionDialog(false)}
      >
        <DialogTitle>Transition Data</DialogTitle>
        <DialogContent>
          {selectedBlock &&
            transitionData[selectedBlock.state]?.[selectedBlock.newState]?.map(
              (field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  margin="normal"
                  label={field.label}
                  type={field.type}
                  value={ transitionFormData[field.name] || ""}
                  onChange={(e) =>
                    setTransitionFormData({
                      ...transitionFormData,
                      [field.name]: e.target.value,
                    })
                  }
                />
              )
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransitionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTransition}
            variant="contained"
            color="primary"
          >
            Complete Transition
          </Button>
        </DialogActions>
      </Dialog>
      { alert && <div style={{paddingTop:"4rem"}} ><Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        This transition is not allowed
      </Alert></div>
      }
    </Box>
  );
};

export default SwimLaneApp;